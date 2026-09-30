import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/Header';
import { SelfCheckoutKiosk } from './components/Kiosk/SelfCheckoutKiosk';
import { DashboardRoot } from './components/Dashboard/DashboardRoot';
import { PublicTVBoard } from './components/Board/PublicTVBoard';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<'kiosk' | 'dashboard' | 'board'>('kiosk');

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans">
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-12">
        {currentTab === 'kiosk' && <SelfCheckoutKiosk />}
        {currentTab === 'dashboard' && <DashboardRoot />}
        {currentTab === 'board' && <PublicTVBoard />}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-4 px-6 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            國立青楓高級中學 員生消費合作社 · 智慧福利社自主管理系統
          </span>
          <span className="text-slate-500 font-mono">
            針對高中生作息 · 自助結帳 · 零過期損耗 · 智慧自動補貨 · 學生會員積點
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
