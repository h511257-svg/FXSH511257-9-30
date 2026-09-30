import React from 'react';
import { useStore } from '../../context/StoreContext';
import { FoodFlavor } from '../../types/store';
import {
  UtensilsCrossed,
  PenTool,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';

export const FlavorAndCategoryDeepDive: React.FC = () => {
  const { products } = useStore();

  // FOOD FLAVORS AGGREGATION
  const flavorLabels: Record<FoodFlavor, string> = {
    black_pepper: '黑胡椒香 (豬排堡/熱點)',
    cheese: '濃郁起司 (炸物/雞排)',
    chocolate: '榛果巧克力 (厚片吐司/甜食)',
    milk_butter: '黃金奶酥 (波蘿麵包)',
    honey_sauce: '蜜汁酸甜 (大亨堡/烤物)',
    strawberry: '草莓果粒 (果醬雙餡)',
    bbq: '炭火BBQ (中秋/限定漢堡)',
    original: '經典原味 (茶葉蛋/豆漿/肉包)',
    matcha: '微苦抹茶 (滯銷口味)',
    none: '其他'
  };

  const foodProducts = products.filter(p => !p.isDelisted && (p.category === 'food_hot' || p.category === 'food_bakery' || p.category === 'seasonal'));

  const flavorStatsMap: Partial<Record<FoodFlavor, { sold: number; revenue: number; profit: number; count: number }>> = {};

  foodProducts.forEach(p => {
    const f = p.flavor || 'original';
    if (!flavorStatsMap[f]) {
      flavorStatsMap[f] = { sold: 0, revenue: 0, profit: 0, count: 0 };
    }
    flavorStatsMap[f]!.sold += p.totalSold;
    flavorStatsMap[f]!.revenue += p.totalSold * p.price;
    flavorStatsMap[f]!.profit += p.totalSold * (p.price - p.cost);
    flavorStatsMap[f]!.count += 1;
  });

  const sortedFlavors = Object.entries(flavorStatsMap)
    .map(([flv, data]) => ({
      flavor: flv as FoodFlavor,
      label: flavorLabels[flv as FoodFlavor] || flv,
      sold: data!.sold,
      revenue: data!.revenue,
      profit: data!.profit,
      margin: Math.round((data!.profit / (data!.revenue || 1)) * 100),
      count: data!.count
    }))
    .sort((a, b) => b.sold - a.sold);

  const totalFoodSold = sortedFlavors.reduce((sum, f) => sum + f.sold, 0) || 1;

  // STATIONERY ANALYSIS
  const stationeryProducts = products.filter(p => !p.isDelisted && p.category === 'stationery');

  // Tip Size comparison
  const tip038 = stationeryProducts.filter(p => p.stationerySpec?.tipSize === '0.38mm');
  const tip05 = stationeryProducts.filter(p => p.stationerySpec?.tipSize === '0.5mm');
  const tip2B = stationeryProducts.filter(p => p.stationerySpec?.tipSize === '2B');

  const tip038Sold = tip038.reduce((s, p) => s + p.totalSold, 0);
  const tip05Sold = tip05.reduce((s, p) => s + p.totalSold, 0);
  const tip2BSold = tip2B.reduce((s, p) => s + p.totalSold, 0);
  const totalPenSold = tip038Sold + tip05Sold + tip2BSold || 1;

  // Ink Color comparison
  const blackInkSold = stationeryProducts.filter(p => p.stationerySpec?.inkColor === 'black').reduce((s, p) => s + p.totalSold, 0);
  const blueInkSold = stationeryProducts.filter(p => p.stationerySpec?.inkColor === 'blue').reduce((s, p) => s + p.totalSold, 0);
  const redInkSold = stationeryProducts.filter(p => p.stationerySpec?.inkColor === 'red').reduce((s, p) => s + p.totalSold, 0);
  const totalColorSold = blackInkSold + blueInkSold + redInkSold || 1;

  // Consumable leader: Correction Tape
  const tapeProduct = products.find(p => p.id === 'prod-18');

  return (
    <div className="space-y-6">
      {/* Overview Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Food Flavor Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>高中生食物口味偏好分析 (Food Flavor Preferences)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                重口味與濃郁甜食霸榜
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              高中生課業壓力大，偏好高香氣、飽足感強烈的【黑胡椒】與【起司】，甜品則以【濃郁巧克力厚片】拔得頭籌。
            </p>

            {/* Flavor Bars */}
            <div className="space-y-3 mt-4">
              {sortedFlavors.slice(0, 6).map((item, idx) => {
                const sharePercent = Math.round((item.sold / totalFoodSold) * 100);
                return (
                  <div key={item.flavor} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{item.label}</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">{item.sold} 份 ({sharePercent}%)</span>
                        <span className="text-emerald-600 font-bold">毛利 {item.margin}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${sharePercent * 2.5}%` }}
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-amber-600' : idx === 1 ? 'bg-indigo-600' : idx === 2 ? 'bg-teal-600' : 'bg-slate-400'
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
            <strong>🎯 貨架口味調整決策：</strong>黑胡椒與起司類利潤率高且極受歡迎，應增加黑胡椒熱狗捲；而抹茶類(18份, 損耗7份)偏好度僅 2%，已列為淘汰名單。
          </div>
        </div>

        {/* Stationery Spec & Tip Size Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span>文具與原子筆規格分析 (Pen Specs & Stationery Breakdown)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                0.38黑筆狂霸榜
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              高中生面對大量筆記與歷屆模擬試題，書寫字跡細緻的 0.38mm 佔比高達 56%，墨水顏色以黑色為絕對主力。
            </p>

            {/* Tip Size Comparison */}
            <div className="mt-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>筆芯規格銷量分佈 (Tip Size)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="text-slate-500 text-[11px]">0.38mm (極細)</div>
                  <div className="text-lg font-bold font-mono text-indigo-900 mt-1">{tip038Sold} 支</div>
                  <div className="text-[10px] text-indigo-600 font-semibold">{Math.round((tip038Sold / totalPenSold) * 100)}% 刷題神器</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">0.5mm (標準)</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-1">{tip05Sold} 支</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{Math.round((tip05Sold / totalPenSold) * 100)}% 隨手筆記</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-slate-500 text-[11px]">2B (電腦畫卡)</div>
                  <div className="text-lg font-bold font-mono text-rose-900 mt-1">{tip2BSold} 盒</div>
                  <div className="text-[10px] text-rose-600 font-semibold">{Math.round((tip2BSold / totalPenSold) * 100)}% 段考前爆量</div>
                </div>
              </div>

              {/* Ink Color Ratio */}
              <div className="text-xs font-bold text-slate-700 mt-4 flex items-center gap-1">
                <span>筆水顏色偏好 (Ink Color Ratio)</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden text-[10px] font-bold text-white text-center leading-4 font-mono">
                <div style={{ width: `${(blackInkSold / totalColorSold) * 100}%` }} className="bg-slate-900">
                  黑筆 {Math.round((blackInkSold / totalColorSold) * 100)}%
                </div>
                <div style={{ width: `${(blueInkSold / totalColorSold) * 100}%` }} className="bg-blue-600">
                  藍筆 {Math.round((blueInkSold / totalColorSold) * 100)}%
                </div>
                <div style={{ width: `${(redInkSold / totalColorSold) * 100}%` }} className="bg-rose-500">
                  紅筆 {Math.round((redInkSold / totalColorSold) * 100)}%
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>黑色: 學測國寫/理化刷題專用</span>
                <span>藍色: 課堂筆記</span>
                <span>紅色: 訂正紅筆</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200/60 flex items-center justify-between">
            <span>
              <strong>📌 PLUS 立可帶替芯 (藍)：</strong>累銷 380 件，毛利 50%，為福利社最高產值文具耗材，建議放置結帳機旁醒目架位！
            </span>
          </div>
        </div>
      </div>

      {/* Product Mix Optimization Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>架上產品組合優化建議與執行方案 (Shelf Assortment Action Plan)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            以真實高中生購買數據為核心，提高獲利並避免過期死庫存
          </p>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 block">
                【擴大陳列】0.38mm 黑筆與 PLUS 滾輪立可帶替芯
              </span>
              <span className="text-slate-500">
                毛利率高達 41% ~ 50%，無保存期限風險。學生常常在考試當天突然斷水，陳列於結帳櫃檯旁邊可顯著提高衝動客單價。
              </span>
            </div>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shrink-0">
              增設架位 +20%
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 block">
                【口味調整】縮減微苦抹茶與苦瓜料理，增設黑椒與起司風味
              </span>
              <span className="text-slate-500">
                高中生對苦味接受度低，導致抹茶拿鐵與苦瓜拌麵過期報廢率高達 38%。應將其貨架替換為學生狂熱的黑椒牛柳堡或牽絲起司條。
              </span>
            </div>
            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold shrink-0">
              淘汰更換品項
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 block">
                【節奏搭售】「經典麥香奶茶 $10」作為帶路雞，捆綁烘焙麵包
              </span>
              <span className="text-slate-500">
                麥香飲料人手一瓶。透過「買現烤巧克力厚片($25)+麥香奶茶($10) 現折$3」的早餐套餐，將高毛利烘焙利潤最大化。
              </span>
            </div>
            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold shrink-0">
              組合連帶促銷
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
