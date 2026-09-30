import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import { ProductIcon } from '../common/ProductIcon';
import { BarcodeGraphic } from '../common/BarcodeGraphic';
import { getProductBarcode, playScannerBeep } from '../../utils/barcodeUtils';
import {
  PackageCheck,
  RefreshCw,
  AlertTriangle,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  Plus,
  Minus,
  Edit2,
  Barcode,
  Printer
} from 'lucide-react';

export const InventoryRestockEngine: React.FC = () => {
  const {
    products,
    getRestockProposals,
    runSmartAutoRestock,
    adjustStock,
    updateProductSettings,
    updateProductBarcode,
    batchRestock
  } = useStore();

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(10);
  const [tempRestockQty, setTempRestockQty] = useState<number>(30);
  const [tempBarcode, setTempBarcode] = useState<string>('');
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'all' | 'barcodes'>('alerts');
  const [restockScanCode, setRestockScanCode] = useState('');
  const [restockScanQty, setRestockScanQty] = useState<number>(10);

  const proposals = getRestockProposals();
  const activeProducts = products.filter(p => !p.isDelisted);

  const displayedProducts = activeTab === 'alerts'
    ? activeProducts.filter(p => p.stock <= p.reorderThreshold)
    : activeProducts;

  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setTempThreshold(p.reorderThreshold);
    setTempRestockQty(p.suggestedRestockQty);
    setTempBarcode(getProductBarcode(p));
  };

  const handleSaveEdit = (productId: string) => {
    updateProductSettings(productId, tempThreshold, tempRestockQty);
    if (tempBarcode.trim().length >= 8) {
      updateProductBarcode(productId, tempBarcode.trim());
    }
    setEditingProductId(null);
  };

  const handleBarcodeRestock = (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const targetCode = (codeOverride ?? restockScanCode).trim();
    if (!targetCode) return;

    const found = activeProducts.find(
      p =>
        getProductBarcode(p) === targetCode ||
        p.id.toLowerCase() === targetCode.toLowerCase() ||
        p.name.toLowerCase().includes(targetCode.toLowerCase())
    );

    if (found) {
      adjustStock(found.id, restockScanQty);
      playScannerBeep('scan');
      setRestockSuccessMessage(
        `嗶！條碼入庫成功：【${found.name}】(${getProductBarcode(found)}) 已入庫 +${restockScanQty} 件，最新庫存 ${found.stock + restockScanQty} 件（已同步至 Firebase）。`
      );
      setRestockScanCode('');
      setTimeout(() => setRestockSuccessMessage(null), 4000);
    } else {
      playScannerBeep('error');
      setRestockSuccessMessage(`⚠️ 查無條碼「${targetCode}」對應商品，請確認條碼編號。`);
      setTimeout(() => setRestockSuccessMessage(null), 3500);
    }
  };

  const handleRunAuto = () => {
    const totalAdded = runSmartAutoRestock();
    setRestockSuccessMessage(`✅ 智慧演算法已自動完成補貨！共計入庫 ${totalAdded} 件商品。`);
    setTimeout(() => setRestockSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-indigo-600" />
            <span>高中福利社 智慧進貨量與自動補貨引擎 (Smart Restock & Threshold Engine)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            根據高中生下課消費速度 (Daily Velocity) 即時動態調整補貨門檻，確保熱門商品永不缺貨、滯銷品零積壓。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAuto}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>一鍵執行演算法自動補貨 ({proposals.length} 項缺貨)</span>
          </button>
        </div>
      </div>

      {restockSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{restockSuccessMessage}</span>
        </div>
      )}

      {/* Supplier Purchase Order Proposal Card */}
      {proposals.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/80 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="font-bold text-xs text-amber-950">
                  系統偵測缺貨預警：建議今日廠商叫貨清單 (Purchase Order Suggestion)
                </h4>
                <p className="text-[11px] text-amber-800/80">
                  共有 {proposals.length} 項商品低於安全庫存警戒線，預估叫貨進貨總成本：NT$ {proposals.reduce((sum, p) => sum + p.estimatedCost, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-amber-900 bg-amber-200/70 px-2.5 py-1 rounded-lg">
                預估利潤率 ~45%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {proposals.map(item => (
              <div key={item.productId} className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.productName}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.urgency === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.urgency === 'high' ? '🚨 緊急缺貨' : '⚠️ 達警戒線'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    目前架上剩: <strong className="text-rose-600 font-mono">{item.currentStock}</strong> 件 / 門檻: {item.reorderThreshold}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px]">
                    建議補貨: <strong className="text-indigo-600 font-mono text-sm">+{item.recommendedOrder}</strong>
                  </div>
                  <button
                    onClick={() => adjustStock(item.productId, item.recommendedOrder)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    單獨入庫
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Quick Scan-to-Restock Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">
              條碼槍快速驗貨入庫 (Barcode Scan-to-Restock)
            </h4>
            <p className="text-[11px] text-slate-400">
              廠商送貨時直接掃描商品 EAN-13 條碼，即可自動累加架上庫存並即時同步寫入 Firebase 雲端資料庫
            </p>
          </div>
        </div>

        <form onSubmit={e => handleBarcodeRestock(e)} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={restockScanCode}
            onChange={e => setRestockScanCode(e.target.value)}
            placeholder="掃描或輸入條碼 (如 4710088100017)..."
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400 w-60"
          />
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">每次入庫:</span>
            {[5, 10, 30].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setRestockScanQty(q)}
                className={`px-2 py-1 rounded-lg font-mono font-bold cursor-pointer ${
                  restockScanQty === q ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                +{q}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>嗶！掃碼入庫</span>
          </button>
        </form>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              需補貨項目 ({activeProducts.filter(p => p.stock <= p.reorderThreshold).length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部上架商品 ({activeProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('barcodes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'barcodes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>商品條碼貼紙簿 ({activeProducts.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            點選「編輯」可自訂商品 EAN-13 條碼、安全庫存門檻與建議進貨量
          </span>
        </div>

        {activeTab === 'barcodes' ? (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="font-bold text-slate-800">青楓高中員生社 · 標準 EAN-13 貨架條碼貼紙總覽</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  點擊任一商品條碼貼紙即可直接模擬條碼槍掃描並入庫 <strong className="text-indigo-700 font-mono">+{restockScanQty}</strong> 件商品
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>列印貨架條碼貼紙</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {activeProducts.map(p => {
                const bCode = getProductBarcode(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleBarcodeRestock(undefined, bCode)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition cursor-pointer bg-white flex flex-col items-center text-center group"
                  >
                    <div className="w-full flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>青楓高中福利社</span>
                      <span className="font-mono font-bold text-indigo-700">NT$ {p.price}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 line-clamp-1 mb-2">
                      {p.name}
                    </div>
                    <BarcodeGraphic value={bCode} height={38} />
                    <div className="w-full mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">庫存: <strong className="font-mono">{p.stock}</strong></span>
                      <span className="text-indigo-600 font-bold group-hover:text-rose-600">
                        點擊掃碼 +{restockScanQty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">商品名稱 / 類別</th>
                <th className="py-3 px-3 font-semibold text-right">售價 / 成本</th>
                <th className="py-3 px-3 font-semibold text-right">日均銷量</th>
                <th className="py-3 px-3 font-semibold text-center">目前架上庫存</th>
                <th className="py-3 px-3 font-semibold text-center">自動補貨門檻</th>
                <th className="py-3 px-3 font-semibold text-center">批次補貨量</th>
                <th className="py-3 px-4 font-semibold text-right">庫存快調 / 設定</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProducts.map(p => {
                const isEditing = editingProductId === p.id;
                const isShortage = p.stock <= p.reorderThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <ProductIcon name={p.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isSeasonal && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                限定
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span className="font-mono text-slate-500">條碼: {getProductBarcode(p)}</span>
                            <span>·</span>
                            <span>保存: {p.shelfLifeDays}天</span>
                            <span>·</span>
                            <span>已售: {p.totalSold}件</span>
                          </div>
                          {isEditing && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-[10px] text-indigo-600 font-semibold">自訂條碼:</span>
                              <input
                                type="text"
                                value={tempBarcode}
                                onChange={e => setTempBarcode(e.target.value)}
                                className="w-32 px-1.5 py-0.5 border border-indigo-400 rounded text-[11px] font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <div className="text-slate-800 font-bold">NT${p.price}</div>
                      <div className="text-[10px] text-slate-400">成本${p.cost}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-semibold text-indigo-700">{p.dailyAvgSales} 件/天</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                        p.stock === 0
                          ? 'bg-rose-100 text-rose-700'
                          : isShortage
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.stock}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={tempThreshold}
                          onChange={e => setTempThreshold(Number(e.target.value))}
                          className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-center text-xs font-mono"
                        />
                      ) : (
                        <span className="font-mono text-slate-600 font-semibold">{p.reorderThreshold}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={tempRestockQty}
                          onChange={e => setTempRestockQty(Number(e.target.value))}
                          className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-center text-xs font-mono"
                        />
                      ) : (
                        <span className="font-mono text-slate-600">+{p.suggestedRestockQty}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs cursor-pointer"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => adjustStock(p.id, -1)}
                            disabled={p.stock <= 0}
                            title="損耗扣減 1 件"
                            className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => adjustStock(p.id, 10)}
                            title="快速手動進貨 +10 件"
                            className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleStartEdit(p)}
                            title="自訂補貨門檻與建議進貨量"
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer ml-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};
