import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, PaymentMethod, SaleTransaction } from '../../types/store';
import { ProductIcon } from '../common/ProductIcon';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { getProductBarcode, playScannerBeep } from '../../utils/barcodeUtils';
import {
  CreditCard,
  QrCode,
  Coins,
  Sparkles,
  Search,
  Barcode,
  Camera,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  UserCheck,
  LogOut,
  Gift,
  Flame,
  Clock,
  Printer,
  X
} from 'lucide-react';

export const SelfCheckoutKiosk: React.FC = () => {
  const {
    products,
    students,
    activeStudent,
    selectStudent,
    logoutStudent,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    scanBarcode,
    completeCheckout,
    currentTimeSlot,
    isExamWeekMode,
    promotions,
    topUpStudentCard
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentInputId, setStudentInputId] = useState('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('easycard');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [recentTransaction, setRecentTransaction] = useState<SaleTransaction | null>(null);
  const [changeReturned, setChangeReturned] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanMessageType, setScanMessageType] = useState<'success' | 'student' | 'error'>('success');
  const [cardTapped, setCardTapped] = useState(false);

  // Barcode Scanner Modal & Audio / Hardware Gun States
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'camera' | 'deck' | 'gun'>('deck');
  const [soundMuted, setSoundMuted] = useState(false);
  const [usbGunListening, setUsbGunListening] = useState(true);
  const hidBufferRef = useRef<string>('');
  const hidLastKeyTimeRef = useRef<number>(0);

  // Global USB/Bluetooth HID Barcode Scanner Gun Listener
  useEffect(() => {
    if (!usbGunListening || isScannerModalOpen || isStudentModalOpen || isPaymentModalOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const now = Date.now();
      if (now - hidLastKeyTimeRef.current > 120) {
        hidBufferRef.current = '';
      }
      hidLastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (hidBufferRef.current.length >= 4) {
          e.preventDefault();
          const codeToScan = hidBufferRef.current;
          hidBufferRef.current = '';
          executeBarcodeScan(codeToScan);
        }
      } else if (e.key.length === 1 && /[0-9a-zA-Z\-]/.test(e.key)) {
        hidBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [usbGunListening, isScannerModalOpen, isStudentModalOpen, isPaymentModalOpen, products, students, soundMuted]);

  // Filter products by category, search, and active time slot
  const filteredProducts = products.filter(p => {
    if (p.isDelisted) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchFlavor = p.flavor?.toLowerCase().includes(q);
      const matchBarcode = getProductBarcode(p).includes(q);
      if (!matchName && !matchDesc && !matchFlavor && !matchBarcode) return false;
    }
    return true;
  });

  // Sort: prioritize items matching current timeSlot or exam mode
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (isExamWeekMode) {
      const aExam = a.timeSlotAffinity.includes('exam_period') ? 1 : 0;
      const bExam = b.timeSlotAffinity.includes('exam_period') ? 1 : 0;
      if (aExam !== bExam) return bExam - aExam;
    }
    const aSlot = a.timeSlotAffinity.includes(currentTimeSlot) ? 1 : 0;
    const bSlot = b.timeSlotAffinity.includes(currentTimeSlot) ? 1 : 0;
    return bSlot - aSlot;
  });

  // Raw cart subtotal
  const rawSubtotal = cart.reduce((acc, item) => {
    const unitPrice = item.product.isClearance && item.product.clearancePrice ? item.product.clearancePrice : item.product.price;
    const bogoPromo = promotions.find(pr => pr.isActive && pr.type === 'bogo_half' && pr.targetCategory === item.product.category);
    if (bogoPromo && item.quantity >= 2) {
      const pairs = Math.floor(item.quantity / 2);
      const remainder = item.quantity % 2;
      return acc + (pairs * unitPrice * 1.5) + (remainder * unitPrice);
    }
    return acc + (unitPrice * item.quantity);
  }, 0);

  // Discount from promotions
  const discountPromo = promotions.find(pr => pr.isActive && pr.type === 'discount');
  const promoDiscount = (discountPromo && discountPromo.discountPercent && (!discountPromo.timeSlotOnly || discountPromo.timeSlotOnly === currentTimeSlot))
    ? Math.round(rawSubtotal * (discountPromo.discountPercent / 100))
    : 0;

  // Max points discount: 10 pts = NT$1
  const maxPointsAvailable = activeStudent ? activeStudent.points : 0;
  const pointsDiscount = Math.floor(pointsToRedeem / 10);
  const finalTotal = Math.max(0, Math.round(rawSubtotal - promoDiscount - pointsDiscount));

  // Execute a barcode scan with sound and visual banner
  const executeBarcodeScan = (code: string) => {
    const res = scanBarcode(code);
    if (res.type === 'product') {
      playScannerBeep('scan', soundMuted);
      setScanMessageType('success');
    } else if (res.type === 'student') {
      playScannerBeep('student', soundMuted);
      setScanMessageType('student');
    } else {
      playScannerBeep('error', soundMuted);
      setScanMessageType('error');
    }
    setScanMessage(res.message);
    setTimeout(() => setScanMessage(null), 3500);
  };

  // Handle barcode simulation scan form
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    executeBarcodeScan(barcodeInput.trim());
    setBarcodeInput('');
  };

  // Quick student scan login
  const handleStudentLogin = (id: string) => {
    const success = selectStudent(id);
    if (success) {
      setIsStudentModalOpen(false);
      setPointsToRedeem(0);
    }
  };

  // Cash denomination adder
  const addCash = (amount: number) => {
    setCashGiven(prev => prev + amount);
  };

  // Execute checkout
  const handleFinalPay = () => {
    if (selectedPaymentMethod === 'easycard') {
      setCardTapped(true);
      setTimeout(() => {
        executeCheckout();
      }, 700);
    } else {
      executeCheckout();
    }
  };

  const executeCheckout = () => {
    const result = completeCheckout(selectedPaymentMethod, pointsToRedeem, cashGiven);
    if (result.success && result.transaction) {
      setRecentTransaction(result.transaction);
      setChangeReturned(result.change || 0);
      setIsPaymentModalOpen(false);
      setCashGiven(0);
      setPointsToRedeem(0);
      setCardTapped(false);
    } else {
      alert(result.error || '結帳失敗，請確認餘額或庫存');
      setCardTapped(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT 8 COLS: KIOSK PRODUCT EXPLORER */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Banner: Student Member Swipe / ID Bar */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-3 border border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              {activeStudent ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{activeStudent.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {activeStudent.gradeClass} ({activeStudent.studentId})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-indigo-200 mt-1">
                    <span>悠遊卡餘額: <strong className="text-emerald-400 font-mono">NT$ {activeStudent.cardBalance}</strong></span>
                    <span>·</span>
                    <span>福利積點: <strong className="text-amber-300 font-mono">{activeStudent.points} 點</strong></span>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-sm tracking-wide">學生證 / 條碼快速登入</h3>
                  <p className="text-xs text-indigo-200/80">感應學生證自動累積福利點數，每10元積1點，滿額可直接折現</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStudent ? (
              <>
                <button
                  onClick={() => topUpStudentCard(activeStudent.studentId, 100)}
                  className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white transition-all shadow-sm cursor-pointer"
                >
                  + 加值 $100
                </button>
                <button
                  onClick={logoutStudent}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-xs font-bold rounded-xl text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>感應學生證 / 選擇會員</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Context Banner (Time slot & Promotions notice) */}
        {isExamWeekMode ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
              <span>
                <strong>【段考週大作戰】</strong> 劃卡專用 2B 鉛筆、PLUS立可帶、提神紅牛應援包全力備貨中，文具類點數3倍狂飆！
              </span>
            </div>
            <span className="font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-100">文具專區置頂</span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                <strong>【時段推薦】：</strong>
                {currentTimeSlot === 'breakfast' && '早自習與第一節下課（延長供應至 09:30）！熱騰騰黑椒蛋堡配麥香奶茶現折 $5，活力滿分！'}
                {currentTimeSlot === 'lunch' && '午餐搶食尖峰！大亨堡、脆皮雞排、肉羹飯熱騰騰供應中！'}
                {currentTimeSlot === 'snack' && '午後課後點心（15:00 提早開賣）！同品項麵包第二件半價，吃飽再去課輔補習班！'}
              </span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">智能架位推薦中</span>
          </div>
        )}

        {/* Barcode Scanner Hub & Search Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex flex-col md:flex-row gap-2">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-1.5">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="掃描或輸入 EAN-13 條碼 (如 4710088100017)、學號 (11204018) 或品名..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Barcode className="w-3.5 h-3.5 text-rose-400" />
                <span>嗶！掃描</span>
              </button>
            </form>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setScannerInitialMode('camera');
                  setIsScannerModalOpen(true);
                }}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>鏡頭掃碼</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScannerInitialMode('deck');
                  setIsScannerModalOpen(true);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>商品條碼本</span>
              </button>

              <button
                type="button"
                onClick={() => setSoundMuted(!soundMuted)}
                title={soundMuted ? '開啟掃碼嗶聲' : '關閉掃碼嗶聲'}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                  !soundMuted
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Barcode Shortcuts & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium">快速試掃條碼：</span>
              {products.filter(p => !p.isDelisted).slice(0, 4).map(p => {
                const code = getProductBarcode(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => executeBarcodeScan(code)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-mono transition cursor-pointer"
                  >
                    {p.name.slice(0, 6)} ({code.slice(-4)})
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setUsbGunListening(!usbGunListening)}
                className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                  usbGunListening
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-400 bg-slate-100'
                }`}
              >
                {usbGunListening ? '● 實體條碼槍就緒' : '○ 條碼槍暫停'}
              </button>
            </div>

            <div className="relative w-full sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="篩選品名/口味/條碼..."
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        {scanMessage && (
          <div
            className={`text-xs py-2 px-3.5 rounded-xl font-bold flex items-center justify-between animate-fadeIn border ${
              scanMessageType === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : scanMessageType === 'student'
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{scanMessage}</span>
            <span className="text-[10px] font-mono opacity-75">POS LASER SCANNER</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'all', label: '全部商品' },
            { key: 'food_hot', label: '🥪 熟食熱點' },
            { key: 'food_bakery', label: '🥐 烘焙麵包' },
            { key: 'beverage', label: '🧃 冰熱飲品' },
            { key: 'stationery', label: '✏️ 考試文具' },
            { key: 'seasonal', label: '🏮 節日限定' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.reorderThreshold;
            const isTimeSlotMatch = product.timeSlotAffinity.includes(currentTimeSlot);
            const isExamMatch = isExamWeekMode && product.timeSlotAffinity.includes('exam_period');

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`bg-white rounded-2xl border transition-all p-3.5 flex flex-col justify-between relative group ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-md cursor-pointer hover:-translate-y-0.5'
                }`}
              >
                {/* Special Tags */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                  {product.isSeasonal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      {product.seasonalTag || '節日限定'}
                    </span>
                  )}
                  {product.isClearance && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold animate-pulse">
                      清倉6折
                    </span>
                  )}
                  {(isTimeSlotMatch || isExamMatch) && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      時段推薦
                    </span>
                  )}
                </div>

                {/* Icon & Title */}
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-2 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ProductIcon name={product.iconName} className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1 leading-snug">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {product.description}
                  </p>

                  {/* Flavor or Spec badge */}
                  <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-slate-500">
                    {product.flavor && product.flavor !== 'none' && (
                      <span className="text-slate-600">
                        {product.flavor === 'black_pepper' && '🧂 黑胡椒'}
                        {product.flavor === 'honey_sauce' && '🍯 蜜汁風味'}
                        {product.flavor === 'chocolate' && '🍫 濃郁巧克'}
                        {product.flavor === 'milk_butter' && '🧈 奶酥香'}
                        {product.flavor === 'strawberry' && '🍓 草莓雙餡'}
                        {product.flavor === 'cheese' && '🧀 牽絲起司'}
                        {product.flavor === 'bbq' && '🔥 炭火BBQ'}
                        {product.flavor === 'original' && '原味精選'}
                        {product.flavor === 'matcha' && '🍵 抹茶'}
                      </span>
                    )}
                    {product.stationerySpec && (
                      <span className="text-slate-600">
                        {product.stationerySpec.tipSize} · {product.stationerySpec.inkColor === 'black' ? '黑墨' : product.stationerySpec.inkColor === 'blue' ? '藍墨' : product.stationerySpec.inkColor === 'red' ? '紅墨' : '標準'}
                      </span>
                    )}
                  </div>

                  {/* EAN-13 Barcode Number Strip */}
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <Barcode className="w-3 h-3 shrink-0" />
                    <span>{getProductBarcode(product)}</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {product.isClearance && product.clearancePrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-rose-600 font-bold font-mono text-sm">
                          NT$ {product.clearancePrice}
                        </span>
                        <span className="text-slate-400 line-through text-[10px] font-mono">
                          ${product.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-indigo-700 font-bold font-mono text-sm">
                        NT$ {product.price}
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {isOutOfStock ? (
                        <span className="text-rose-500 font-bold">已售完</span>
                      ) : isLowStock ? (
                        <span className="text-amber-600 font-medium">剩 {product.stock} 件</span>
                      ) : (
                        <span>庫存: {product.stock}</span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={e => {
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        executeBarcodeScan(getProductBarcode(product));
                      }
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT 4 COLS: ORDER SUMMARY & KIOSK CHECKOUT */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">自助結帳購物車</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} 件
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
              >
                清空
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="divide-y divide-slate-100 my-2 max-h-[340px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                <Barcode className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs">請點選左側商品或掃描條碼</p>
                <p className="text-[11px] text-slate-300 mt-1">高中生最愛：麥香、豬排堡、立可帶</p>
              </div>
            ) : (
              cart.map(item => {
                const p = item.product;
                const unitPrice = p.isClearance && p.clearancePrice ? p.clearancePrice : p.price;
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{p.name}</h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        NT$ {unitPrice} x {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(p.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-xs font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(p.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Points Redemption Slider (If student is logged in) */}
          {activeStudent && activeStudent.points >= 10 && cart.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 my-2 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-amber-900 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  <span>福利點數折抵現金 (10點折$1)</span>
                </span>
                <span className="text-amber-800 font-bold font-mono">
                  折抵 NT$ {pointsDiscount}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(activeStudent.points, rawSubtotal * 10)}
                step="10"
                value={pointsToRedeem}
                onChange={e => setPointsToRedeem(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-amber-700/80 mt-1">
                <span>0 點</span>
                <span>使用 {pointsToRedeem} / {activeStudent.points} 點</span>
              </div>
            </div>
          )}

          {/* Pricing Calculation Summary */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>商品小計:</span>
              <span className="font-mono text-slate-700">NT$ {rawSubtotal}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>活動專案折扣:</span>
                <span className="font-mono">- NT$ {promoDiscount}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>福利點數折抵:</span>
                <span className="font-mono">- NT$ {pointsDiscount}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
              <span>應付總額:</span>
              <span className="font-mono text-xl text-indigo-700">NT$ {finalTotal}</span>
            </div>
            {activeStudent && (
              <div className="text-[11px] text-slate-400 text-right">
                結帳完成預計獲贈 +{Math.floor(finalTotal / 10)} 福利點數
              </div>
            )}
          </div>

          {/* Checkout Button */}
          <button
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className={`w-full mt-4 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]'
            }`}
          >
            <span>前往自助付款 (NT$ {finalTotal})</span>
          </button>
        </div>
      </div>

      {/* STUDENT SELECTION MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>高中生會員登入 / 感應學生證</span>
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                輸入 8 碼學號 (例如 11204018)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentInputId}
                  onChange={e => setStudentInputId(e.target.value)}
                  placeholder="輸入學號..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
                <button
                  onClick={() => handleStudentLogin(studentInputId)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 cursor-pointer"
                >
                  確認
                </button>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                或快速選擇模擬在校生 (悠遊卡餘額與點數):
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {students.map(s => (
                  <div
                    key={s.studentId}
                    onClick={() => handleStudentLogin(s.studentId)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${s.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                        {s.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.gradeClass} · 學號 {s.studentId}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-emerald-600 font-mono font-bold">餘額 NT${s.cardBalance}</div>
                      <div className="text-amber-600 text-[10px] font-medium">{s.points} 點</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT METHOD MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">自助結帳投幣與多元付款</h3>
                <p className="text-xs text-slate-400">青楓高中福利社 支援學生常用支付</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="my-4 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-600 font-semibold block">應付結帳總額</span>
                <span className="text-2xl font-black text-indigo-900 font-mono">
                  NT$ {finalTotal}
                </span>
              </div>
              {activeStudent && (
                <div className="text-right text-xs text-indigo-700">
                  <span className="block font-medium">結帳會員: {activeStudent.name}</span>
                  <span className="text-[11px] text-indigo-500 font-mono">學生證餘額: NT$ {activeStudent.cardBalance}</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { key: 'easycard', label: '學生證悠遊卡', icon: <CreditCard className="w-4 h-4" /> },
                { key: 'cash', label: '自助投幣/現金', icon: <Coins className="w-4 h-4" /> },
                { key: 'linepay', label: 'LINE Pay / 台灣Pay', icon: <QrCode className="w-4 h-4" /> }
              ].map(method => (
                <button
                  key={method.key}
                  onClick={() => setSelectedPaymentMethod(method.key as PaymentMethod)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    selectedPaymentMethod === method.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method.icon}
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {/* Detail Views for selected payment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 min-h-[170px] flex flex-col justify-center">
              {selectedPaymentMethod === 'easycard' && (
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 transition-all ${
                    cardTapped ? 'bg-emerald-500 text-white scale-110 animate-ping' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {cardTapped ? '感應成功，扣款中...' : '請將學生證/悠遊卡輕觸感應區'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeStudent
                      ? `卡號: ${activeStudent.studentId} · 扣款後剩餘 NT$ ${Math.max(0, activeStudent.cardBalance - finalTotal)}`
                      : '⚠️ 提醒：請先登入學生證會員以扣款'}
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'cash' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-600">已投入金額: <strong className="text-indigo-600 font-mono text-sm">NT$ {cashGiven}</strong></span>
                    <span className="text-slate-600">
                      找零: <strong className="text-emerald-600 font-mono text-sm">NT$ {Math.max(0, cashGiven - finalTotal)}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => addCash(10)}
                      className="py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      🪙 +$10
                    </button>
                    <button
                      onClick={() => addCash(50)}
                      className="py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      🪙 +$50
                    </button>
                    <button
                      onClick={() => addCash(100)}
                      className="py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      💵 +$100
                    </button>
                    <button
                      onClick={() => addCash(500)}
                      className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 transition cursor-pointer"
                    >
                      💵 +$500
                    </button>
                  </div>
                  {cashGiven > 0 && (
                    <button
                      onClick={() => setCashGiven(0)}
                      className="text-[10px] text-slate-400 hover:text-rose-500 mt-2 block text-right cursor-pointer"
                    >
                      退幣重投
                    </button>
                  )}
                </div>
              )}

              {selectedPaymentMethod === 'linepay' && (
                <div className="text-center py-1">
                  <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center mb-2">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">請開啟 LINE Pay 或 台灣Pay 掃描條碼</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">高中生無現金校園支付模式</p>
                </div>
              )}
            </div>

            {/* Confirm Payment Trigger */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleFinalPay}
                disabled={selectedPaymentMethod === 'cash' && cashGiven < finalTotal}
                className={`flex-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                  selectedPaymentMethod === 'cash' && cashGiven < finalTotal
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                確認完成付款
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL (AFTER SUCCESSFUL CHECKOUT) */}
      {recentTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">結帳成功！請取走收據</h3>
              <p className="text-xs text-slate-500">國立青楓高級中學 員生消費合作社</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                交易編號: {recentTransaction.id} · {recentTransaction.dateStr}
              </span>
            </div>

            {/* Items summary */}
            <div className="my-3 text-xs space-y-1.5 divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {recentTransaction.items.map((it, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between">
                  <span className="text-slate-700 truncate max-w-[190px]">
                    {it.productName} x {it.quantity}
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">
                    NT$ {it.price * it.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Total & Change */}
            <div className="py-2 border-t border-dashed border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>支付方式:</span>
                <span className="font-medium">
                  {recentTransaction.paymentMethod === 'easycard' && '學生證悠遊卡'}
                  {recentTransaction.paymentMethod === 'cash' && '現金投幣機'}
                  {recentTransaction.paymentMethod === 'linepay' && 'LINE Pay行動支付'}
                </span>
              </div>
              {changeReturned > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>找零退幣:</span>
                  <span className="font-mono">NT$ {changeReturned}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline font-bold text-sm text-slate-900 pt-1">
                <span>實付總額:</span>
                <span className="text-indigo-700 font-mono text-base">
                  NT$ {recentTransaction.totalAmount}
                </span>
              </div>
              {recentTransaction.pointsEarned > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold text-[11px] pt-1">
                  <span>本次消費累計點數:</span>
                  <span>+{recentTransaction.pointsEarned} 點 🎉</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRecentTransaction(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                完成並返回首頁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL (CAMERA / STICKER DECK / USB GUN) */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        initialMode={scannerInitialMode}
        soundMuted={soundMuted}
        onToggleSound={() => setSoundMuted(!soundMuted)}
        onScanResult={res => {
          setScanMessageType(
            res.type === 'product' ? 'success' : res.type === 'student' ? 'student' : 'error'
          );
          setScanMessage(res.message);
          setTimeout(() => setScanMessage(null), 3500);
        }}
      />
    </div>
  );
};
