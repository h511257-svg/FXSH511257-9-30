import React, { useState, useEffect, useRef } from 'react';
import { useStore, ScanBarcodeResult } from '../../context/StoreContext';
import { ProductCategory } from '../../types/store';
import { BarcodeGraphic } from '../common/BarcodeGraphic';
import { ProductIcon } from '../common/ProductIcon';
import { getProductBarcode, playScannerBeep } from '../../utils/barcodeUtils';
import {
  Camera,
  Barcode,
  X,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertCircle,
  Search,
  UserCheck,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Keyboard
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'camera' | 'deck' | 'gun';
  soundMuted: boolean;
  onToggleSound: () => void;
  onScanResult?: (res: ScanBarcodeResult) => void;
}

interface ScanLogEntry {
  id: string;
  time: string;
  code: string;
  result: ScanBarcodeResult;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'deck',
  soundMuted,
  onToggleSound,
  onScanResult
}) => {
  const { products, students, scanBarcode, cart } = useStore();

  const [mode, setMode] = useState<'camera' | 'deck' | 'gun'>(initialMode);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [deckFilter, setDeckFilter] = useState<ProductCategory | 'all' | 'students'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [activeLaserId, setActiveLaserId] = useState<string | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [latestBanner, setLatestBanner] = useState<ScanBarcodeResult | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [simulatedCameraCard, setSimulatedCameraCard] = useState<{
    name: string;
    code: string;
    price?: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Manage camera stream lifecycle
  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  // Native BarcodeDetector polling when camera is active
  useEffect(() => {
    if (!cameraActive || mode !== 'camera') return;
    const WinBarcodeDetector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (!WinBarcodeDetector) return;

    let isCancelled = false;
    let detector: any = null;
    try {
      detector = new WinBarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a']
      });
    } catch {
      return;
    }

    const interval = setInterval(async () => {
      if (isCancelled || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          triggerBarcodeProcess(barcodes[0].rawValue);
        }
      } catch {
        // ignore frame detection error
      }
    }, 650);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [cameraActive, mode, soundMuted, continuousMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('此瀏覽器環境不支援直接開啟視訊鏡頭，請使用下方「鏡頭前出示條碼模擬」或切換至「互動條碼感應板」。');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraError('未偵測到實體攝影機或未授權鏡頭權限 — 您可直接點擊下方「模擬將商品遞至鏡頭前」體驗紅外線感應結帳！');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const triggerBarcodeProcess = (code: string, highlightId?: string) => {
    if (highlightId) {
      setActiveLaserId(highlightId);
      setTimeout(() => setActiveLaserId(null), 550);
    }

    const res = scanBarcode(code);
    if (res.type === 'product') {
      playScannerBeep('scan', soundMuted);
    } else if (res.type === 'student') {
      playScannerBeep('student', soundMuted);
    } else {
      playScannerBeep('error', soundMuted);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setScanLogs(prev => [
      { id: `${Date.now()}-${Math.random()}`, time: timeStr, code, result: res },
      ...prev.slice(0, 19)
    ]);
    setLatestBanner(res);
    if (onScanResult) onScanResult(res);

    if (!continuousMode && (res.type === 'product' || res.type === 'student')) {
      setTimeout(() => {
        onClose();
      }, 650);
    }
  };

  const handleSimulateHoldToCamera = (name: string, code: string, price?: number) => {
    setSimulatedCameraCard({ name, code, price });
    setTimeout(() => {
      triggerBarcodeProcess(code, code);
    }, 280);
    setTimeout(() => {
      setSimulatedCameraCard(null);
    }, 1300);
  };

  if (!isOpen) return null;

  const activeProducts = products.filter(p => !p.isDelisted);
  const filteredDeckProducts = activeProducts.filter(p => {
    if (deckFilter !== 'all' && deckFilter !== 'students' && p.category !== deckFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const bCode = getProductBarcode(p);
      return (
        p.name.toLowerCase().includes(q) ||
        bCode.includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* TOP HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  青楓高中福利社 · 智慧光學條碼掃描系統
                </h3>
                <span className="text-[11px] text-rose-300 font-mono">
                  EAN-13 / Code-128
                </span>
              </div>
              <p className="text-xs text-slate-400">
                支援視訊光學鏡頭掃碼、商品條碼貼紙一鍵感應、以及實體 USB 條碼槍快速結帳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Continuous Mode Toggle */}
            <button
              onClick={() => setContinuousMode(!continuousMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                continuousMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{continuousMode ? '連續掃描模式' : '單次掃描即關'}</span>
            </button>

            {/* Beep Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                !soundMuted
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={soundMuted ? '點擊開啟嗶聲提示' : '點擊靜音'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODE SWITCH TABS */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode('deck')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'deck'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>互動商品條碼感應板 ({activeProducts.length})</span>
            </button>
            <button
              onClick={() => setMode('camera')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'camera'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>光學鏡頭即時掃描</span>
            </button>
            <button
              onClick={() => setMode('gun')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'gun'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>條碼槍輸入 / 掃碼紀錄 ({scanLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-600">
              目前購物車：<strong className="text-indigo-700 font-mono">{totalCartItems}</strong> 件商品
            </span>
          </div>
        </div>

        {/* LIVE SCAN FEEDBACK TOAST BAR */}
        {latestBanner && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between border-b transition-all ${
              latestBanner.type === 'product'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : latestBanner.type === 'student'
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {latestBanner.type === 'product' || latestBanner.type === 'student' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{latestBanner.message}</span>
            </div>
            <span className="font-mono text-[11px] opacity-75">條碼: {latestBanner.code}</span>
          </div>
        )}

        {/* MAIN MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* === MODE 1: INTERACTIVE BARCODE STICKER DECK === */}
          {mode === 'deck' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { key: 'all', label: '全部商品條碼' },
                    { key: 'food_hot', label: '熟食熱點' },
                    { key: 'food_bakery', label: '烘焙麵包' },
                    { key: 'beverage', label: '冰熱飲品' },
                    { key: 'stationery', label: '考試文具' },
                    { key: 'seasonal', label: '節日限定' },
                    { key: 'students', label: '學生證條碼卡' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDeckFilter(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        deckFilter === tab.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {deckFilter !== 'students' && (
                  <div className="relative sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜尋品名或 471 條碼..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                )}
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  💡 <strong>操作方式：</strong>直接點擊下方任一商品或學生證的「條碼貼紙」，紅外線雷射將瞬間感應並發出「嗶！」聲加入購物車！
                </span>
                <span className="font-mono text-[11px] text-amber-700 shrink-0 ml-2">
                  點擊即掃描
                </span>
              </div>

              {deckFilter === 'students' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {students.map(stu => {
                    const isLaser = activeLaserId === stu.studentId;
                    return (
                      <div
                        key={stu.studentId}
                        onClick={() => triggerBarcodeProcess(stu.studentId, stu.studentId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between bg-white hover:border-indigo-500 hover:shadow-md ${
                          isLaser ? 'ring-2 ring-rose-500 bg-rose-50/20 scale-[0.99]' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full ${stu.avatarColor} text-white font-bold text-xs flex items-center justify-center`}>
                              {stu.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{stu.name}</div>
                              <div className="text-[11px] text-slate-500">{stu.gradeClass}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-700 font-bold">
                            餘額 ${stu.cardBalance}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center">
                          <BarcodeGraphic
                            value={`STU-${stu.studentId}`}
                            height={36}
                            showLaser={isLaser}
                          />
                          <span className="text-[10px] text-indigo-600 font-semibold mt-1">
                            點擊感應學生證登入
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredDeckProducts.map(product => {
                    const bCode = getProductBarcode(product);
                    const isLaser = activeLaserId === product.id;
                    const isOut = product.stock <= 0;
                    const effectivePrice =
                      product.isClearance && product.clearancePrice
                        ? product.clearancePrice
                        : product.price;
                    const inCartQty = cart.find(c => c.product.id === product.id)?.quantity || 0;

                    return (
                      <div
                        key={product.id}
                        onClick={() => !isOut && triggerBarcodeProcess(bCode, product.id)}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                          isOut
                            ? 'opacity-55 bg-slate-50 border-slate-200 cursor-not-allowed'
                            : isLaser
                            ? 'ring-2 ring-rose-500 bg-rose-50/20 scale-[0.98] border-rose-400 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        {inCartQty > 0 && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-[10px] shadow-xs">
                            已掃 x{inCartQty}
                          </span>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                              <ProductIcon name={product.iconName} className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-xs text-slate-800 line-clamp-1">
                              {product.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                            <span className="font-mono font-bold text-indigo-700">
                              NT$ {effectivePrice}
                            </span>
                            <span>
                              {isOut ? (
                                <strong className="text-rose-600">已售完</strong>
                              ) : (
                                `庫存 ${product.stock}`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Barcode Sticker Box */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200/90 group-hover:border-rose-300 transition flex flex-col items-center relative overflow-hidden">
                          <BarcodeGraphic
                            value={bCode}
                            height={34}
                            showLaser={isLaser}
                          />
                          <div className="w-full mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-rose-600 font-semibold">
                            <span>EAN-13</span>
                            <span>嗶！點擊掃碼</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* === MODE 2: OPTICAL CAMERA SCANNER === */}
          {mode === 'camera' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Camera Viewfinder */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-20'}`}
                  />

                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                      <Camera className="w-10 h-10 text-rose-400 mb-2 opacity-80" />
                      <p className="text-xs text-slate-200 font-semibold max-w-md leading-relaxed">
                        {cameraError || '正在啟動光學鏡頭...'}
                      </p>
                      <button
                        onClick={startCamera}
                        className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        重新嘗試連接實體鏡頭
                      </button>
                    </div>
                  )}

                  {/* Optical Viewfinder Overlay Bracket & Animated Red Laser Line */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-rose-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-rose-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-rose-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-rose-500 rounded-br-lg" />

                    {/* Laser Scanline */}
                    <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />

                    {/* Simulated Product Held in Front of Camera */}
                    {simulatedCameraCard && (
                      <div className="bg-white/95 backdrop-blur-xs px-5 py-3 rounded-2xl shadow-2xl border-2 border-emerald-400 flex flex-col items-center animate-bounce z-20">
                        <span className="text-xs font-bold text-slate-900 mb-1">
                          {simulatedCameraCard.name}
                        </span>
                        <BarcodeGraphic
                          value={simulatedCameraCard.code}
                          height={44}
                          showLaser={true}
                        />
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>紅外線雷射對焦就緒 (將商品條碼置於紅線中央)</span>
                    </span>
                    <span className="font-mono text-rose-400">60 FPS</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Simulate Holding Product to Camera */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>鏡頭前出示商品條碼模擬 (點擊即遞至鏡頭紅線前)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    手邊無實體商品條碼時，點選下方熱門商品即可模擬學生將商品拿到光學鏡頭前感應：
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 mt-3 max-h-[260px] overflow-y-auto pr-1">
                    {activeProducts.slice(0, 10).map(p => {
                      const code = getProductBarcode(p);
                      return (
                        <button
                          key={p.id}
                          disabled={p.stock <= 0}
                          onClick={() => handleSimulateHoldToCamera(p.name, code, p.price)}
                          className="p-2.5 bg-white hover:bg-indigo-50/60 rounded-xl border border-slate-200 hover:border-indigo-400 transition flex items-center justify-between text-left cursor-pointer disabled:opacity-40"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{code}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] shrink-0">
                            對準鏡頭 ${p.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">亦可感應學生證條碼：</span>
                  <button
                    onClick={() =>
                      handleSimulateHoldToCamera(
                        `${students[0].name} 學生證`,
                        students[0].studentId
                      )
                    }
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>模擬感應 {students[0].name} 學生證</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === MODE 3: USB BARCODE GUN & SCAN HISTORY === */}
          {mode === 'gun' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>實體條碼槍 (USB HID / 藍牙掃碼槍) 查驗與手動輸入</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  連接標準 USB 條碼槍後，直接扣下扳機即可自動輸入 13 碼國際條碼並觸發 Enter 結帳；或於下方手動輸入條碼測試：
                </p>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!manualCode.trim()) return;
                    triggerBarcodeProcess(manualCode);
                    setManualCode('');
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="輸入 EAN-13 條碼 (如 4710088100017)、商品代碼 (prod-01) 或學號 (11204018)..."
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    嗶！確認送出
                  </button>
                </form>
              </div>

              {/* Scan Logs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    本次掃碼感應歷史紀錄 ({scanLogs.length} 筆)
                  </span>
                  {scanLogs.length > 0 && (
                    <button
                      onClick={() => setScanLogs([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      清除紀錄
                    </button>
                  )}
                </div>

                {scanLogs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    尚無掃碼紀錄，請於「條碼感應板」或使用條碼槍進行掃描
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {scanLogs.map(log => (
                      <div
                        key={log.id}
                        className="px-4 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-slate-400">{log.time}</span>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {log.code}
                          </span>
                          <span className="text-slate-800 font-medium">{log.result.message}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            log.result.type === 'product'
                              ? 'text-emerald-600'
                              : log.result.type === 'student'
                              ? 'text-indigo-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {log.result.type === 'product'
                            ? '商品入車'
                            : log.result.type === 'student'
                            ? '會員登入'
                            : '異常提示'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            已支援台灣商品標準碼 <strong className="font-mono text-slate-700">4710088xxxxxx</strong> 與青楓高中 8 碼學號條碼
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            完成掃碼 · 返回結帳櫃檯 ({totalCartItems} 件)
          </button>
        </div>
      </div>
    </div>
  );
};
