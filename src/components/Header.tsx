import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { TimeSlot } from '../types/store';
import {
  Store,
  LayoutDashboard,
  Tv,
  Sun,
  Coffee,
  Sunset,
  Flame,
  AlertTriangle,
  RotateCcw,
  Cloud,
  Globe,
  Copy,
  Check,
  QrCode,
  X
} from 'lucide-react';

const SHARED_APP_URL = 'https://ais-pre-zzfmioixrdtyzahnc3farh-657506308124.asia-northeast1.run.app';
const DEV_APP_URL = 'https://ais-dev-zzfmioixrdtyzahnc3farh-657506308124.asia-northeast1.run.app';

interface HeaderProps {
  currentTab: 'kiosk' | 'dashboard' | 'board';
  setCurrentTab: (tab: 'kiosk' | 'dashboard' | 'board') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const {
    currentTimeSlot,
    setCurrentTimeSlot,
    isExamWeekMode,
    setIsExamWeekMode,
    avgDailyRevenue,
    todayRevenue,
    overallGrossMargin,
    getRestockProposals,
    resetAllData,
    isFirebaseConnected,
    isSyncing
  } = useStore();

  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

  const handleCopyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlKey(key);
    setTimeout(() => setCopiedUrlKey(null), 2000);
  };

  const restockAlerts = getRestockProposals().filter(p => p.urgency === 'high').length;

  const timeSlots: { key: TimeSlot; label: string; time: string; icon: React.ReactNode }[] = [
    { key: 'breakfast', label: '早自習早餐', time: '07:00-09:30', icon: <Sun className="w-3.5 h-3.5" /> },
    { key: 'lunch', label: '午休尖峰', time: '11:30-13:30', icon: <Coffee className="w-3.5 h-3.5" /> },
    { key: 'snack', label: '課後點心時段', time: '15:00-17:30', icon: <Sunset className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top utility ticker: School Name & Quick Stats */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-semibold tracking-wider text-slate-200">國立青楓高級中學 · 員生消費合作社</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">校園智慧零售 & 庫存週轉優化系統</span>
          <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px]">
            <Cloud className={`w-3 h-3 ${isFirebaseConnected ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className={isFirebaseConnected ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
              {isSyncing ? 'Firebase 同步中...' : isFirebaseConnected ? 'Firebase 雲端已連線' : '本機離線快取'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <div>
            <span className="text-slate-500 mr-1">今日營收:</span>
            <span className="font-bold text-emerald-400 font-mono">NT$ {todayRevenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">日均銷售額:</span>
            <span className="font-bold text-amber-400 font-mono">NT$ {avgDailyRevenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">綜合毛利率:</span>
            <span className="font-bold text-sky-400 font-mono">{overallGrossMargin}%</span>
          </div>
          {restockAlerts > 0 && (
            <div className="flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{restockAlerts} 項急需補貨</span>
            </div>
          )}
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 font-semibold transition-colors cursor-pointer"
          >
            <Globe className="w-3 h-3 text-indigo-300" />
            <span>APP 專屬網址</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('確定重置為福利社預設示範數據？')) {
                resetAllData();
              }
            }}
            title="重設為系統預設值"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重設數據</span>
          </button>
        </div>
      </div>

      {/* Main navigation & Mode switchers */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo / App Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              青楓高中 智慧福利社
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                高中生自營專區
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              全自動結帳 · 庫存自動補貨 · 零損耗口味分析 · 學生集點
            </p>
          </div>
        </div>

        {/* Time-Slot & Exam-Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
          <span className="text-slate-400 px-2 font-medium">時段排程:</span>
          {timeSlots.map(slot => (
            <button
              key={slot.key}
              onClick={() => {
                setCurrentTimeSlot(slot.key);
                if (isExamWeekMode) setIsExamWeekMode(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                currentTimeSlot === slot.key && !isExamWeekMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {slot.icon}
              <span>{slot.label}</span>
              <span className="text-[10px] opacity-70">({slot.time})</span>
            </button>
          ))}

          <button
            onClick={() => setIsExamWeekMode(!isExamWeekMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              isExamWeekMode
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-2 ring-rose-400'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>段考週衝刺模式</span>
            {isExamWeekMode && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
          </button>
        </div>

        {/* View Switcher: Kiosk vs Dashboard vs TV Board */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setCurrentTab('kiosk')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'kiosk'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>自助結帳 Kiosk</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>營運與庫存中控</span>
          </button>

          <button
            onClick={() => setCurrentTab('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentTab === 'board'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>福利社電視看板</span>
          </button>
        </div>
      </div>

      {/* APP URL & SHARE MODAL */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 text-slate-800">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    青楓高中智慧福利社 · APP 專屬雲端網址
                  </h3>
                  <p className="text-xs text-slate-500">
                    已部署於 Google Cloud Run (亞太東京節點) 並連結 Firebase Firestore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Shared Public URL */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">
                    1. 公開分享正式網址 (Shared App URL · 推薦提供給師生使用)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">HTTPS 線上運行中</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={SHARED_APP_URL}
                    className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl font-mono text-[11px] text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyUrl('shared', SHARED_APP_URL)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedUrlKey === 'shared' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrlKey === 'shared' ? '已複製' : '複製網址'}</span>
                  </button>
                </div>
              </div>

              {/* Dev Preview URL */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    2. 開發者即時預覽網址 (Development App URL)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">asia-northeast1</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={DEV_APP_URL}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-600 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyUrl('dev', DEV_APP_URL)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedUrlKey === 'dev' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrlKey === 'dev' ? '已複製' : '複製網址'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile QR Code Preview */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl border border-indigo-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-11 h-11 text-slate-800" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-indigo-950">支援手機、平板與福利社 POS 觸控螢幕</div>
                  <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                    在手機瀏覽器開啟上述網址，即可直接使用手機鏡頭掃描商品條碼進行自助結帳與盤點，所有資料皆透過 Firebase 即時同步。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
