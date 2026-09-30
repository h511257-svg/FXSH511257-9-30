import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types/store';
import { ProductIcon } from '../common/ProductIcon';
import {
  Percent,
  TrendingUp,
  PieChart,
  Award,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Filter
} from 'lucide-react';

export const ProfitMarginMatrix: React.FC = () => {
  const { products, toggleClearance, delistProduct } = useStore();
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  const activeProducts = products.filter(p => !p.isDelisted && (categoryFilter === 'all' || p.category === categoryFilter));

  // Category average margins
  const categoryStats = ['food_hot', 'food_bakery', 'beverage', 'stationery', 'seasonal'].map(cat => {
    const prods = products.filter(p => !p.isDelisted && p.category === cat);
    if (prods.length === 0) return { cat, label: cat, avgMargin: 0, count: 0, totalRev: 0 };
    const avgMargin = Math.round(
      prods.reduce((sum, p) => sum + ((p.price - p.cost) / p.price) * 100, 0) / prods.length
    );
    const totalRev = prods.reduce((sum, p) => sum + p.price * p.totalSold, 0);
    const labels: Record<string, string> = {
      food_hot: '🥪 熟食熱點',
      food_bakery: '🥐 烘焙麵包',
      beverage: '🧃 冷熱飲品',
      stationery: '✏️ 考試文具',
      seasonal: '🏮 節慶限定'
    };
    return { cat, label: labels[cat] || cat, avgMargin, count: prods.length, totalRev };
  });

  // Quadrant classification
  // Median sales ~ 200, Median margin ~ 45%
  const stars = activeProducts.filter(p => p.totalSold >= 200 && ((p.price - p.cost) / p.price) >= 0.45);
  const volumeDrivers = activeProducts.filter(p => p.totalSold >= 200 && ((p.price - p.cost) / p.price) < 0.45);
  const potentialNiche = activeProducts.filter(p => p.totalSold < 200 && ((p.price - p.cost) / p.price) >= 0.45);
  const dogs = activeProducts.filter(p => p.totalSold < 50 && ((p.price - p.cost) / p.price) < 0.35);

  return (
    <div className="space-y-6">
      {/* Category Margins Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoryStats.map(stat => (
          <div key={stat.cat} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">{stat.label}</span>
              <span className="text-[11px] text-slate-400">{stat.count} 款上架中</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">平均毛利率</span>
                <span className={`text-xl font-mono font-bold ${
                  stat.avgMargin >= 50 ? 'text-emerald-600' : stat.avgMargin >= 40 ? 'text-indigo-600' : 'text-amber-600'
                }`}>
                  {stat.avgMargin}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  style={{ width: `${Math.min(100, stat.avgMargin * 1.5)}%` }}
                  className={`h-full ${
                    stat.avgMargin >= 50 ? 'bg-emerald-500' : stat.avgMargin >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Profit-Optimization Suggestion Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-200">
              福利社架上產品組合獲利優化策略 (Product Mix Optimization)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. <strong>文具耗材高毛利引擎</strong>：PLUS立可帶(50%毛利)、UNI 0.38筆芯(41%毛利)不佔空間且無過期報廢風險，應擴大陳列面。<br/>
              2. <strong>熟食以黑椒/起司口味為主軸</strong>：黑椒蛋堡銷量達 342 份(毛利42%)，應維持穩定早自習現做進貨，淘汰滯銷苦瓜拌麵。<br/>
              3. <strong>飲品走量帶動連帶購買</strong>：麥香奶茶銷量高達 890 瓶(為全校流量之冠)，透過「麵包+麥香折$5」刺激高毛利烘焙銷量。
            </p>
          </div>
        </div>
      </div>

      {/* 4-Quadrant Matrix Visualizer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>商品獲利與銷量四象限矩陣 (Volume vs Profit Margin Matrix)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              縱軸為毛利率(%)，橫軸為累計銷售量(份)，精準定位每一款商品的經營策略
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['all', 'food_hot', 'food_bakery', 'beverage', 'stationery', 'seasonal'] as const).map(f => (
              <button
                key={f}
                onClick={() => setCategoryFilter(f)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  categoryFilter === f ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 'all' ? '全部' : f === 'food_hot' ? '熟食' : f === 'food_bakery' ? '麵包' : f === 'beverage' ? '飲料' : f === 'stationery' ? '文具' : '節慶'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Quadrants Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Q1: Stars / Cash Cows */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 mb-3">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>金牛明星商品 (高銷量 &gt; 200 · 高毛利 &ge; 45%)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                重點保證貨源
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {stars.map(p => {
                const margin = Math.round(((p.price - p.cost) / p.price) * 100);
                return (
                  <div key={p.id} className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <ProductIcon name={p.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">累銷 {p.totalSold} 件 · 成本 ${p.cost}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-emerald-600 text-sm">毛利 {margin}%</div>
                      <div className="text-[10px] text-slate-500 font-mono">售價 NT${p.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q2: Traffic / Volume Drivers */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 mb-3">
              <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>走量導流商品 (高銷量 &gt; 200 · 穩定毛利 &lt; 45%)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-800">
                薄利多銷主力
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {volumeDrivers.map(p => {
                const margin = Math.round(((p.price - p.cost) / p.price) * 100);
                return (
                  <div key={p.id} className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <ProductIcon name={p.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">累銷 {p.totalSold} 件 · 銅板價熱門款</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-indigo-600 text-sm">毛利 {margin}%</div>
                      <div className="text-[10px] text-slate-500 font-mono">售價 NT${p.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q3: Potential / High Margin Niches */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-3">
              <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>高利潤潛力股 (中量銷量 · 高毛利 &ge; 45%)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                可加強行銷推廣
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {potentialNiche.map(p => {
                const margin = Math.round(((p.price - p.cost) / p.price) * 100);
                return (
                  <div key={p.id} className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <ProductIcon name={p.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">累銷 {p.totalSold} 件 · 段考/特定時段熱門</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-amber-600 text-sm">毛利 {margin}%</div>
                      <div className="text-[10px] text-slate-500 font-mono">售價 NT${p.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q4: Delist / Phase-out Alert */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 mb-3">
              <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>淘汰清倉警戒品 (銷量低迷 &lt; 50 · 毛利低迷 &lt; 35%)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                建議淘汰下架
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">目前無滯銷賠錢品項</div>
              ) : (
                dogs.map(p => {
                  const margin = Math.round(((p.price - p.cost) / p.price) * 100);
                  return (
                    <div key={p.id} className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <ProductIcon name={p.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-rose-500 font-medium">
                            僅售 {p.totalSold} 件 · 過期損耗 {p.wastageCount} 件
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold font-mono text-rose-600 text-sm">毛利 {margin}%</div>
                          <div className="text-[10px] text-slate-400 font-mono">利潤偏低</div>
                        </div>
                        <button
                          onClick={() => toggleClearance(p.id)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          {p.isClearance ? '取消出清' : '出清6折'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
