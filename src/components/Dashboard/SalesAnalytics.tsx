import React from 'react';
import { useStore } from '../../context/StoreContext';
import { HOURLY_SALES_DISTRIBUTION } from '../../data/initialData';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertOctagon,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react';

export const SalesAnalytics: React.FC = () => {
  const { dailySummaries, avgDailyRevenue, todayRevenue, wastageRate, activeTurnoverRate } = useStore();

  const maxRevenue = Math.max(...dailySummaries.map(d => d.totalRevenue), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Average Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>每日平均銷售額 (7日均)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              NT$ {avgDailyRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>較上週同期穩健成長 +8.2%</span>
            </div>
          </div>
        </div>

        {/* Today's Estimated Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>今日累計營收 (即時)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-indigo-700">
              NT$ {todayRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              下課尖峰時段已產生 360+ 筆交易
            </div>
          </div>
        </div>

        {/* Turnover Rate */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>庫存週轉率 (月化)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {activeTurnoverRate} 次/月
            </div>
            <div className="text-[11px] text-amber-600 flex items-center gap-1 mt-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>自動補貨機制維持高流動性</span>
            </div>
          </div>
        </div>

        {/* Wastage Rate */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>食品過期與損耗率</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {wastageRate}%
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              時段動態打折成功減少 85% 浪費
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Revenue & Margin Trend Visualizer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>近 7 日每日營收與毛利趨勢 (Daily Revenue & Profit Trend)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              平日下課時段營收充沛，週五達到最高峰 NT$ 16,950
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <span className="w-3 h-3 rounded bg-indigo-600"></span> 每日營收
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> 毛利額
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 font-medium">
              <span className="w-3 h-3 rounded bg-rose-400"></span> 損耗損失
            </span>
          </div>
        </div>

        {/* SVG Bar / Area visualization */}
        <div className="pt-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pb-6 border-b border-slate-200">
            {dailySummaries.map((day, idx) => {
              const revHeight = Math.round((day.totalRevenue / maxRevenue) * 100);
              const profitHeight = Math.round((day.grossProfit / maxRevenue) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2 pointer-events-none shadow-lg whitespace-nowrap z-10">
                    <div>營收: NT$ {day.totalRevenue.toLocaleString()}</div>
                    <div>毛利: NT$ {day.grossProfit.toLocaleString()} ({day.marginPercent}%)</div>
                    <div>損耗: NT$ {day.wastageLoss}</div>
                  </div>

                  {/* Dual Bar (Revenue + Profit) */}
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all group-hover:brightness-110"
                    ></div>
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-1/2 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md transition-all group-hover:brightness-110"
                    ></div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-600 mt-2 truncate w-full text-center">
                    {day.date}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ${day.totalRevenue}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>💡 營運優化亮點：每週一~五日均營業額約 NT$ 15,240；損耗率壓制在 1.2% 以內。</span>
            <span className="font-mono text-indigo-700 font-semibold">週轉天數預估：3.5 天</span>
          </div>
        </div>
      </div>

      {/* Hourly Sales Rhythm in High School (高中生作息與下課搶食時段分佈) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>高中作息時段人流與銷售集中度分析 (Hourly Peak & Rush Hour Analysis)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            下課只有 10 分鐘！高中福利社銷售呈現極高度的波峰集中特性，需精準備貨避免結帳壅塞。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 mt-4">
          {HOURLY_SALES_DISTRIBUTION.map((slot, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                slot.percentage >= 20
                  ? 'bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-400/30'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{slot.label}</span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    slot.percentage >= 20 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {slot.percentage}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slot.hour}</div>
              </div>

              <div className="my-2">
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${slot.percentage * 3.5}%` }}
                    className={`h-full ${slot.percentage >= 20 ? 'bg-indigo-600' : 'bg-slate-400'}`}
                  ></div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-700 font-mono">
                  時段均額 NT${slot.avgRevenue}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  熱銷: {slot.dominant}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
