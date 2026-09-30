import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, FoodFlavor } from '../../types/store';
import { ProductIcon } from '../common/ProductIcon';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  PlusCircle,
  TrendingDown,
  CheckCircle,
  Tag,
  Archive,
  Layers,
  X
} from 'lucide-react';

export const ProductPhaseOutManager: React.FC = () => {
  const { products, delistProduct, restoreProduct, toggleClearance, addNewProduct } = useStore();
  const [activeTab, setActiveTab] = useState<'candidates' | 'delisted'>('candidates');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('food_hot');
  const [newPrice, setNewPrice] = useState(40);
  const [newCost, setNewCost] = useState(22);
  const [newStock, setNewStock] = useState(30);
  const [newFlavor, setNewFlavor] = useState<FoodFlavor>('black_pepper');
  const [newDescription, setNewDescription] = useState('');

  // Identify delist candidates:
  // low daily avg (< 3.0) or low total sold (< 30) AND (low margin < 35% OR high wastage > 3)
  const delistCandidates = products.filter(p => {
    if (p.isDelisted) return false;
    const margin = ((p.price - p.cost) / p.price) * 100;
    const isSluggish = p.dailyAvgSales <= 3.0 || p.totalSold <= 30;
    const isUnprofitableOrWasteful = margin < 35 || p.wastageCount >= 3;
    return isSluggish && isUnprofitableOrWasteful;
  });

  const delistedProducts = products.filter(p => p.isDelisted);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addNewProduct({
      name: newName,
      category: newCategory,
      price: newPrice,
      cost: newCost,
      stock: newStock,
      reorderThreshold: Math.round(newStock * 0.4),
      suggestedRestockQty: newStock,
      dailyAvgSales: 15,
      shelfLifeDays: newCategory.startsWith('food') ? 2 : 365,
      iconName: newCategory === 'food_hot' ? 'sandwich' : newCategory === 'beverage' ? 'coffee' : 'pen-tool',
      timeSlotAffinity: ['lunch', 'snack'],
      flavor: newFlavor,
      description: newDescription || '福利社全新引進測試新品！'
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <span>滯銷與低利潤商品淘汰機制 (Product Phase-Out & Delisting)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            高中福利社貨架空間寸土寸金！自動揪出「銷量低、利潤薄、報廢多」的賠錢商品，一鍵出清或下架，把寶貴位置留給熱銷爆款。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新增新品試賣</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-800 font-semibold block">滯銷待淘汰候選</span>
            <span className="text-2xl font-bold font-mono text-rose-950 mt-1 block">
              {delistCandidates.length} 款
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500 stroke-1" />
        </div>

        <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 font-semibold block">已下架封存商品</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {delistedProducts.length} 款
            </span>
          </div>
          <Archive className="w-8 h-8 text-slate-400 stroke-1" />
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-semibold block">已釋放高價值貨架</span>
            <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 block">
              +{delistedProducts.length * 2} 展售格
            </span>
          </div>
          <Layers className="w-8 h-8 text-emerald-500 stroke-1" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'candidates'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          待淘汰警戒品項 ({delistCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab('delisted')}
          className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'delisted'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          已永久下架品項 ({delistedProducts.length})
        </button>
      </div>

      {/* List Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        {activeTab === 'candidates' ? (
          <div>
            {delistCandidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">目前架上所有商品營運健康！</p>
                <p className="text-slate-400 mt-1">無低於標準之賠錢或滯銷商品。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {delistCandidates.map(p => {
                  const margin = Math.round(((p.price - p.cost) / p.price) * 100);
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <ProductIcon name={p.iconName} className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                              高淘汰風險
                            </span>
                            {p.isClearance && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                                清倉特價中
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                            <span>累計銷量: <strong className="text-rose-600 font-bold">{p.totalSold} 件</strong></span>
                            <span>·</span>
                            <span>日均銷量: <strong className="text-slate-700">{p.dailyAvgSales} 件/天</strong></span>
                            <span>·</span>
                            <span>毛利率: <strong className="text-slate-700">{margin}%</strong></span>
                            <span>·</span>
                            <span>過期報廢: <strong className="text-rose-700 font-bold">{p.wastageCount} 件</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleClearance(p.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            p.isClearance
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5 inline mr-1" />
                          {p.isClearance ? '已開啟出清6折' : '啟動出清特賣'}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`確定淘汰並移除商品【${p.name}】嗎？`)) {
                              delistProduct(p.id);
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>確認淘汰下架</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {delistedProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                尚無任何已淘汰商品
              </div>
            ) : (
              <div className="space-y-3">
                {delistedProducts.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center">
                        <ProductIcon name={p.iconName} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-700">{p.name}</div>
                        <div className="text-[10px] text-slate-400">售價 ${p.price} · 累計已售 {p.totalSold} 件</div>
                      </div>
                    </div>

                    <button
                      onClick={() => restoreProduct(p.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重新恢復上架</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD TRIAL PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>新增福利社試賣新品 (New Product Trial)</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">商品名稱</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：黑椒牛柳軟法堡、無糖薄荷口香糖..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">類別</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="food_hot">熟食熱點</option>
                    <option value="food_bakery">烘焙麵包</option>
                    <option value="beverage">冰熱飲品</option>
                    <option value="stationery">考試文具</option>
                    <option value="seasonal">節日限定</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">口味偏好</label>
                  <select
                    value={newFlavor}
                    onChange={e => setNewFlavor(e.target.value as FoodFlavor)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="black_pepper">黑胡椒香 (高人氣)</option>
                    <option value="cheese">濃郁起司 (熱賣)</option>
                    <option value="chocolate">榛果巧克力</option>
                    <option value="milk_butter">黃金奶酥</option>
                    <option value="honey_sauce">蜜汁酸甜</option>
                    <option value="original">經典原味</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">售價 (NT$)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">進貨成本 (NT$)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={e => setNewCost(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">首批進貨量</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(Number(e.target.value))}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">商品亮點簡介</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="高中生下課秒殺首選，滿滿飽足感..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  確認上架試賣
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
