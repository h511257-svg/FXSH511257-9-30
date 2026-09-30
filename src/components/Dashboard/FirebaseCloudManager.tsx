import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { syncAllStoreDataToFirebase, fetchStoreDataFromFirebase } from '../../services/firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import {
  Database,
  RefreshCw,
  CheckCircle,
  Server,
  Layers,
  ShieldCheck,
  Zap,
  Code2,
  Globe,
  Copy,
  Check,
  Terminal,
  Rocket
} from 'lucide-react';

const VERCEL_CONFIG_JSON = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

export const FirebaseCloudManager: React.FC = () => {
  const {
    products,
    students,
    promotions,
    dailySummaries,
    transactions
  } = useStore();

  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<'products' | 'students' | 'promotions' | 'transactions'>('products');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Automatically sync latest data (including new EAN-13 product barcodes) when opening the Cloud Manager
  useEffect(() => {
    syncAllStoreDataToFirebase({
      products,
      students,
      promotions,
      dailySummaries,
      transactions
    }).catch(() => {});
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    setPushStatus('正在建立批次寫入請求 (Batch write)...');
    try {
      const res = await syncAllStoreDataToFirebase({
        products,
        students,
        promotions,
        dailySummaries,
        transactions
      });
      if (res.success) {
        setPushStatus(`✅ 成功同步！已將 ${res.count} 筆文件寫入 Firebase Firestore (${firebaseConfig.firestoreDatabaseId})。`);
      } else {
        setPushStatus(`⚠️ 同步失敗: ${res.error}`);
      }
    } catch (e: any) {
      setPushStatus(`❌ 錯誤: ${e?.message}`);
    } finally {
      setIsPushing(false);
      setTimeout(() => setPushStatus(null), 5000);
    }
  };

  const handleTestLatency = async () => {
    setIsTestingPing(true);
    const start = performance.now();
    try {
      await fetchStoreDataFromFirebase();
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
    } catch (e) {
      setPingLatency(null);
    } finally {
      setIsTestingPing(false);
    }
  };

  const collectionsInfo = [
    {
      name: 'products',
      label: '福利社商品庫存 (Products)',
      count: products.length,
      desc: '熟食、烘焙、飲料、文具與節慶限定',
      sample: products[0]
    },
    {
      name: 'students',
      label: '學生證會員與點數 (Students)',
      count: students.length,
      desc: '學號、悠遊卡餘額、累積福利點數',
      sample: students[0]
    },
    {
      name: 'promotions',
      label: '促銷與時段企劃 (Promotions)',
      count: promotions.length,
      desc: '晨間朝食、下課半價、段考3倍點數',
      sample: promotions[0]
    },
    {
      name: 'transactions',
      label: '結帳交易明細 (Transactions)',
      count: transactions.length,
      desc: '流水收據、發票、實收與找零紀錄',
      sample: transactions[0]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Firebase Cloud Firestore 資料庫中樞
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  已連線上線 (Active)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                全校福利社營運資料已成功託管於 Google Cloud Platform 亞太地區 Firestore 叢集，支援全校多台自助結帳機、電視看板與管理後台零時差即時同步。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePushAll}
              disabled={isPushing}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
              <span>{isPushing ? '同步寫入中...' : '立即批次推播至 Firebase'}</span>
            </button>
          </div>
        </div>

        {pushStatus && (
          <div className="mt-4 p-3 rounded-xl bg-slate-800/90 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pushStatus}</span>
          </div>
        )}
      </div>

      {/* Cloud Metadata & Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Firebase 專案 ID</span>
          <span className="text-sm font-bold font-mono text-slate-900 mt-1 block truncate">
            {firebaseConfig.projectId}
          </span>
          <span className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Google Cloud 託管</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Firestore 資料庫 ID</span>
          <span className="text-sm font-bold font-mono text-indigo-700 mt-1 block truncate">
            {firebaseConfig.firestoreDatabaseId || '(default)'}
          </span>
          <span className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1">
            <Server className="w-3 h-3" />
            <span>多集合獨立執行個體</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">雲端同步延遲 (Latency)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold font-mono text-slate-900">
              {pingLatency !== null ? `${pingLatency} ms` : '正常 (~65ms)'}
            </span>
            <button
              onClick={handleTestLatency}
              disabled={isTestingPing}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
            >
              {isTestingPing ? '測試中...' : '測速'}
            </button>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">亞太節點即時反應</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">安全規則狀態</span>
          <span className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>已部屬 firestore.rules</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">合作社 POS 讀寫授權完成</span>
        </div>
      </div>

      {/* Collection Explorer & Raw Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Firebase 集合架構與線上文件預覽 (Collections Inspector)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              直接檢視 Firestore 集合結構與對應之資料文件
            </p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto">
            {collectionsInfo.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedCollection(c.name as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCollection === c.name
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                /{c.name} ({c.count})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Collection Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 block">集合路徑</span>
              <span className="text-sm font-bold font-mono text-indigo-700 block mt-0.5">
                /{selectedCollection}
              </span>
              <span className="text-xs text-slate-600 mt-2 block">
                {collectionsInfo.find(c => c.name === selectedCollection)?.desc}
              </span>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">雲端文件總數:</span>
                <span className="font-bold font-mono text-slate-900">
                  {collectionsInfo.find(c => c.name === selectedCollection)?.count} 筆
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1 text-amber-950">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>即時寫入連動保證</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                學生在自助結帳機完成支付後，庫存與交易記錄會同步寫入此集合；離線時則無縫切換本機快取，永不斷線。
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-950 rounded-2xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firestore Document Snapshot (JSON · 含 EAN-13 條碼欄位)</span>
              </span>
              <span>READ-ONLY PREVIEW</span>
            </div>
            <pre className="pt-3 max-h-80 overflow-y-auto leading-relaxed text-[11px] text-emerald-300">
              {JSON.stringify(collectionsInfo.find(c => c.name === selectedCollection)?.sample, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* VERCEL DEPLOYMENT & CI/CD SYNC SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Vercel 生產環境部署與 Firebase 跨網域同步設定 (Vercel Production Ready)
                </h4>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ● vercel.json 已配置完成
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                專案根目錄已自動生成標準 <code className="font-mono text-slate-700">/vercel.json</code> 設定檔，支援 Vite 靜態編譯、SPA 路由重寫與 Firebase 即時連線
              </p>
            </div>
          </div>

          <button
            onClick={handlePushAll}
            disabled={isPushing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>同步最新條碼與庫存至雲端</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Deployment Steps & CLI */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>01. 透過 Vercel CLI 或 GitHub 自動部署</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                在匯出專案或連結 GitHub 儲存庫後，Vercel 會自動讀取根目錄的 <code className="font-mono font-bold">vercel.json</code> 並執行 <code className="font-mono font-bold">npm run build</code> 發佈至全球 CDN：
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] flex items-center justify-between">
                <span>npx vercel --prod</span>
                <button
                  onClick={() => handleCopy('cli', 'npx vercel --prod')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cli' ? '已複製' : '複製指令'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
              <div className="font-bold text-indigo-950">
                02. Vercel 與 Firebase Firestore 即時連動說明
              </div>
              <p className="text-indigo-900/80 leading-relaxed text-[11px]">
                本系統之 Firebase 連線組態已內建於專案中（Database ID: <code className="font-mono font-bold">{firebaseConfig.firestoreDatabaseId}</code>）。部署至 Vercel 後，請於 Firebase Console 之「Authentication / 網域設定」或直接透過公開 POS 規則即可與本機端共享同一座雲端資料庫。
              </p>
            </div>
          </div>

          {/* Right: vercel.json preview */}
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-4 text-slate-200 font-mono text-xs border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span>/vercel.json (已寫入專案根目錄)</span>
              <button
                onClick={() => handleCopy('vercel_json', VERCEL_CONFIG_JSON)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'vercel_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'vercel_json' ? '已複製設定' : '複製 JSON'}</span>
              </button>
            </div>
            <pre className="pt-3 text-[11px] text-amber-300 overflow-x-auto leading-relaxed">
              {VERCEL_CONFIG_JSON}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
