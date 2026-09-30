// Taiwan EAN-13 Barcode generator, validator, and POS Laser Beep sound synthesizer

/**
 * Calculates the 13th check digit for a 12-digit EAN-13 prefix
 */
export function calculateEan13CheckDigit(twelveDigits: string): string {
  const digits = twelveDigits.replace(/\D/g, '').padStart(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const num = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? num : num * 3;
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return `${digits}${checkDigit}`;
}

/**
 * Deterministic Taiwan EAN-13 barcode (471 prefix) for any product
 */
export function getProductBarcode(product: { id: string; barcode?: string }): string {
  if (product.barcode && product.barcode.trim().length >= 8) {
    return product.barcode.trim();
  }
  // Extract numeric part from id e.g. 'prod-01' -> 1
  const match = product.id.match(/\d+/);
  const numPart = match ? parseInt(match[0], 10) : 999;
  const base12 = `4710088${String(10000 + numPart).slice(-5)}`;
  return calculateEan13CheckDigit(base12);
}

/**
 * Generates a new Taiwan EAN-13 barcode for newly created products
 */
export function generateNewEan13Barcode(seedNumber?: number): string {
  const rand5 = seedNumber
    ? String(10000 + (seedNumber % 89999)).slice(-5)
    : String(Math.floor(10000 + Math.random() * 89999));
  return calculateEan13CheckDigit(`4710088${rand5}`);
}

/**
 * Deterministic Student ID Card Barcode (Code-128 style format)
 */
export function getStudentBarcode(studentId: string): string {
  return studentId.trim();
}

// Shared AudioContext instance for crisp low-latency POS beeps
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Synthesizes an authentic supermarket POS barcode scanner sound
 */
export function playScannerBeep(
  type: 'scan' | 'student' | 'error' = 'scan',
  muted: boolean = false
): void {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'scan') {
      // Classic single crisp 1380Hz laser scanner beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1380, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'student') {
      // Friendly double rising chime for student card scan
      const freqs = [1100, 1560];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.095);
      });
    } else if (type === 'error') {
      // Low error buzz (320Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.setValueAtTime(220, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}
