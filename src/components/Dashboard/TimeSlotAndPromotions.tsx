import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { TimeSlot, ProductCategory } from '../../types/store';
import { ProductIcon } from '../common/ProductIcon';
import {
  CalendarDays,
  Sparkles,
  Flame,
  Sun,
  Coffee,
  Sunset,
  Tag,
  Gift,
  CheckCircle,
  Plus,
  Clock
} from 'lucide-react';

export const TimeSlotAndPromotions: React.FC = () => {
  const {
    products,
    promotions,
    togglePromotion,
    addPromotion,
    currentTimeSlot,
    setCurrentTimeSlot,
    isExamWeekMode,
    setIsExamWeekMode
  } = useStore();

  const [isNewPromoModalOpen, setIsNewPromoModalOpen] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoType, setPromoType] = useState<'discount' | 'bogo_half' | 'points_multiplier'>('discount');
  const [promoDiscount, setPromoDiscount] = useState(15);
  const [promoCategory, setPromoCategory] = useState<ProductCategory>('food_bakery');

  const seasonalProducts = products.filter(p => p.isSeasonal || p.category === 'seasonal');

  const timeSlotsInfo: { key: TimeSlot; label: string; period: string; icon: React.ReactNode; desc: string; focus: string }[] = [
    {
      key: 'breakfast',
      label: '早自習晨間朝食 (延長至09:30)',
      period: '07:00 - 09:30',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      desc: '配合學生第一節下課補給需求，早餐熱食供應時間延長至 09:30，主打高飽足與高效率出餐。',
      focus: '黑椒豬排蛋堡、營養三明治、高纖豆漿、麥香奶茶'
    },
    {
      key: 'lunch',
      label: '午餐正餐尖峰',
      period: '11:30 - 13:30',
      icon: <Coffee className="w-5 h-5 text-indigo-500" />,
      desc: '中午鐘聲一響百人衝刺福利社！熱食熱狗堡、雞排飯糰全速供應。',
      focus: '大亨堡、脆皮雞排、肉羹燴飯、炭烤牛排堡'
    },
    {
      key: 'snack',
      label: '課後點心時段 (自15:00開賣)',
      period: '15:00 - 17:30',
      icon: <Sunset className="w-5 h-5 text-rose-500" />,
      desc: '自下午 15:00 提早開賣，滿足第七節下課與放學前能量充電，主打甜點與炸物。',
      focus: '濃郁巧克力厚片、奶酥菠蘿麵包、奧利多水、茶葉蛋'
    }
  ];

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim()) return;

    addPromotion({
      title: promoTitle,
      description: promoDesc || '福利社學生專屬特惠！',
      type: promoType,
      discountPercent: promoType === 'discount' ? promoDiscount : undefined,
      pointsMultiplier: promoType === 'points_multiplier' ? 3 : undefined,
      targetCategory: promoCategory,
      isActive: true,
      tagText: '限時特惠',
      bannerColor: 'bg-emerald-600'
    });

    setIsNewPromoModalOpen(false);
    setPromoTitle('');
    setPromoDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Time Slot Scheduler Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>高中作息時段動態輪播機制 (Time-of-Day Dynamic Shifts)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              前台自助結帳機根據鐘聲時段，自動將最適合該時段的食物與文具置頂推薦
            </p>
          </div>
          <span className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
            目前生效時段: {isExamWeekMode ? '⚡ 段考週衝刺' : currentTimeSlot === 'breakfast' ? '早自習早餐' : currentTimeSlot === 'lunch' ? '午餐尖峰' : '放學點心'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {timeSlotsInfo.map(slot => {
            const isActive = currentTimeSlot === slot.key && !isExamWeekMode;
            return (
              <div
                key={slot.key}
                onClick={() => {
                  setCurrentTimeSlot(slot.key);
                  if (isExamWeekMode) setIsExamWeekMode(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {slot.icon}
                      <span className="font-bold text-xs text-slate-900">{slot.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {slot.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{slot.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400 block mb-0.5">置頂主打熱銷品:</span>
                  <span className="font-medium text-slate-800">{slot.focus}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exam Period Override Banner */}
        <div className={`mt-4 p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isExamWeekMode
            ? 'bg-gradient-to-r from-rose-900 to-slate-900 text-white border-rose-700 shadow-md'
            : 'bg-rose-50/60 border-rose-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isExamWeekMode ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-600'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs">期中考 / 學測模擬考 全校緊急應援模式 (Exam Week Special)</h4>
                {isExamWeekMode && (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-500 text-white rounded font-bold animate-pulse">
                    已啟動
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isExamWeekMode ? 'text-rose-200' : 'text-slate-500'}`}>
                啟動後前台將強力置頂 2B劃卡鉛筆組、PLUS立可帶替芯、提神紅牛應援包，文具消費點數3倍狂送！
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExamWeekMode(!isExamWeekMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              isExamWeekMode
                ? 'bg-white text-rose-900 hover:bg-rose-50 shadow-sm'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
            }`}
          >
            {isExamWeekMode ? '退出段考模式' : '啟動段考週模式'}
          </button>
        </div>
      </div>

      {/* Holiday Specials Section (中秋烤肉堡、端午粽子等) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-rose-600" />
              <span>節慶與特定節日限定商品企劃 (Holiday Specials & Seasonal Creations)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              配合校園話題與傳統節日，推出高中生暴動搶購的限定美味，短時間引爆銷售話題
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            目前共 {seasonalProducts.length} 款節慶特選
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {seasonalProducts.map(p => (
            <div key={p.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-[10px]">
                    {p.seasonalTag || '節日限定'}
                  </span>
                  <span className="font-mono text-indigo-700 font-bold text-sm">
                    NT$ {p.price}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <ProductIcon name={p.iconName} className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                </div>
                <p className="text-slate-500 mt-2 text-[11px] leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">目前庫存: <strong className="text-slate-800 font-mono">{p.stock}</strong> 件</span>
                <span className="text-emerald-700 font-bold">累計銷售: {p.totalSold} 份</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flash Promotions & Discount Activities */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>不定時促銷與學生專屬特惠 (Flash Sales & Member Discounts)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              激發放學與下課十分鐘衝動消費，並提高學生會員黏著度
            </p>
          </div>

          <button
            onClick={() => setIsNewPromoModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>建立快閃特惠</span>
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {promotions.map(promo => (
            <div
              key={promo.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                promo.isActive
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                  promo.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{promo.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {promo.tagText}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{promo.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-bold ${promo.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {promo.isActive ? '進行中' : '已暫停'}
                </span>
                <button
                  onClick={() => togglePromotion(promo.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    promo.isActive
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {promo.isActive ? '暫停活動' : '啟用特惠'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW PROMO MODAL */}
      {isNewPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">建立快閃促銷活動</h3>
              <button onClick={() => setIsNewPromoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">活動標題</label>
                <input
                  type="text"
                  required
                  value={promoTitle}
                  onChange={e => setPromoTitle(e.target.value)}
                  placeholder="例如：熱音社成發應援！買炸雞送麥香..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">特惠機制</label>
                <select
                  value={promoType}
                  onChange={e => setPromoType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="discount">整單/類別折扣 (例如 9折)</option>
                  <option value="bogo_half">同類商品第二件半價</option>
                  <option value="points_multiplier">會員消費福利點數 3倍送</option>
                </select>
              </div>

              {promoType === 'discount' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">折扣幅度 (%)</label>
                  <input
                    type="number"
                    value={promoDiscount}
                    onChange={e => setPromoDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">活動詳情說明</label>
                <textarea
                  rows={2}
                  value={promoDesc}
                  onChange={e => setPromoDesc(e.target.value)}
                  placeholder="輸入活動文案..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPromoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  立即發布促銷
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
