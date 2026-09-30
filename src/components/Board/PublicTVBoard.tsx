import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductIcon } from '../common/ProductIcon';
import {
  Flame,
  Award,
  Clock,
  Sparkles,
  TrendingUp,
  Megaphone,
  Bell,
  Sun,
  Coffee,
  Sunset
} from 'lucide-react';

export const PublicTVBoard: React.FC = () => {
  const { products, currentTimeSlot, isExamWeekMode, promotions } = useStore();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Top 10 Best Sellers
  const top10 = [...products]
    .filter(p => !p.isDelisted)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10);

  // Time slot labels
  const slotTitle = isExamWeekMode
    ? '⚡【段考週大作戰·學霸祈福補給】'
    : currentTimeSlot === 'breakfast'
    ? '🌅【晨光朝食·早自習精力首選】'
    : currentTimeSlot === 'lunch'
    ? '🍱【午餐尖峰·熱騰騰秒殺美味】'
    : '🥯【課後放學·社團補給能量站】';

  // Authentic student taglines
  const studentReviews: Record<string, string> = {
    'prod-11': '「高中生血液裡流的都是麥香！$10銅板永遠的神！」',
    'prod-01': '「現煎黑胡椒香到隔壁班都來問，早自習救星！」',
    'prod-18': '「立可帶超滑順不卡帶，段考刷題必備替芯！」',
    'prod-07': '「厚抹榛果巧克力，考前甜食吃完直接多拿10分！」',
    'prod-02': '「清爽小黃瓜美乃滋，下課10分鐘直接衝刺買完！」',
    'prod-15': '「0.38黑筆出墨超順，歷屆試題整本寫完都不累！」',
    'prod-03': '「放學必吃！咬下去真的有牽絲起司跟脆皮！」',
    'prod-05': '「茶葉蛋滷得超入味，體育課打完籃球補充蛋白質！」',
    'prod-22': '「中秋節限定的炭烤黑牛菠蘿堡，沒搶到會被同學笑！」',
    'prod-24': '「紅牛應援包喝下去，今晚熬夜模考直接封神！」'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      {/* TV Screen Wrapper */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border-4 border-slate-800 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top TV Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-800 gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <Flame className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  青楓高中 福利社即時銷量看板
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  LIVE 即時連線
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                福利社大螢幕播映系統 · 學生熱門搶購排行榜 TOP 10
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-right">
              <span className="text-[10px] text-slate-400 block">校園標準時間</span>
              <span className="text-lg font-bold text-emerald-400 tracking-wider font-mono">
                {timeStr || '12:00:00'}
              </span>
            </div>
          </div>
        </div>

        {/* Ticker / Running Marquee */}
        <div className="my-4 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-xs flex items-center gap-3 text-amber-300 overflow-hidden relative z-10">
          <div className="flex items-center gap-1.5 font-bold shrink-0 text-amber-400">
            <Megaphone className="w-4 h-4 animate-bounce" />
            <span>【福利社即時廣播】</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-slate-200">
            <span className="inline-block animate-marquee">
              🔔 下課十分鐘快閃！烘焙麵包同品項第二件半價 · 🏮 中秋節限定【炭烤BBQ黑牛菠蘿堡】熱烈供應中！ · ✏️ 段考週文具滿百元享點數3倍送 · 學生證悠遊卡請備妥感應加快結帳！
            </span>
          </div>
        </div>

        {/* Main TV Board Split: TOP 10 Grid + Current Time Slot Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 mt-2">
          {/* LEFT 8 COLS: TOP 10 LEADERBOARD */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>本週高中生瘋搶排行榜 TOP 10</span>
              </span>
              <span className="text-[11px] text-slate-500">每 60 秒刷新一次</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {top10.map((item, idx) => {
                const isChampion = idx === 0;
                const isRunnerUp = idx === 1;
                const isThird = idx === 2;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isChampion
                        ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/50 shadow-md shadow-amber-950/30'
                        : isRunnerUp
                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950/40 border-slate-700'
                        : isThird
                        ? 'bg-gradient-to-r from-slate-900 to-amber-950/20 border-slate-800'
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-mono shadow-sm ${
                          isChampion
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300'
                            : isRunnerUp
                            ? 'bg-slate-300 text-slate-900'
                            : isThird
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                          {isChampion && <span className="text-[10px] text-amber-400">👑</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 italic truncate mt-0.5">
                          {studentReviews[item.id] || '學生熱門搶購狂推！'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-black font-mono text-sm block">
                        NT$ {item.price}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        累售 {item.totalSold} 件
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4 COLS: CURRENT TIME-SLOT SPOTLIGHT */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gradient-to-b from-indigo-950/80 to-slate-900 p-5 rounded-2xl border border-indigo-800/60 shadow-lg">
              <div className="flex items-center gap-2 pb-3 border-b border-indigo-900/60">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs text-indigo-200">當前時段主打推薦</h4>
              </div>

              <div className="mt-3">
                <span className="text-sm font-black text-white block mb-1">{slotTitle}</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isExamWeekMode
                    ? '全校段考應援中！大考劃卡鉛筆、PLUS立可帶備貨充足，買文具點數3倍狂飆！'
                    : currentTimeSlot === 'breakfast'
                    ? '早自習黑椒豬排蛋堡熱騰騰煎起，搭配麥香奶茶只要銅板價！'
                    : currentTimeSlot === 'lunch'
                    ? '午餐現烤熱狗大亨堡與起司雞排，滿滿飽足感，吃飽下午專心上課！'
                    : '下午第八節下課點心，現烤巧克力厚片與奶酥菠蘿麵包限時第二件半價！'}
                </p>
              </div>

              {/* Spotlight Product Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <ProductIcon
                      name={isExamWeekMode ? 'zap' : currentTimeSlot === 'breakfast' ? 'sandwich' : currentTimeSlot === 'lunch' ? 'pizza' : 'croissant'}
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isExamWeekMode
                        ? '期中考週【必勝提神紅牛應援包】'
                        : currentTimeSlot === 'breakfast'
                        ? '福利社黑椒豬排蛋堡'
                        : currentTimeSlot === 'lunch'
                        ? '美式香烤熱狗大亨堡'
                        : '現烤濃郁巧克力厚片吐司'}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono">
                      人氣特選 · 供應充足
                    </span>
                  </div>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {isExamWeekMode ? 'NT$75' : currentTimeSlot === 'breakfast' ? 'NT$45' : currentTimeSlot === 'lunch' ? 'NT$38' : 'NT$25'}
                </span>
              </div>
            </div>

            {/* Quick Tips for High Schoolers */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Bell className="w-3.5 h-3.5" />
                <span>福利社自助結帳溫馨叮嚀</span>
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li>學生證悠遊卡感應前請先確認餘額充足</li>
                <li>累積福利點數可於結帳畫面點選「折抵現金」</li>
                <li>條碼機若無法感應，可手動輸入學號登入</li>
                <li>響鐘前三分鐘為人流高峰，請依序排隊結帳</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
