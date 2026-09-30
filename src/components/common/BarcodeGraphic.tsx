import React, { useMemo } from 'react';

interface BarcodeGraphicProps {
  value: string;
  height?: number;
  showText?: boolean;
  showLaser?: boolean;
  className?: string;
}

/**
 * Renders a crisp, deterministic 1D Barcode SVG (EAN-13 / Code-128 visual encoding)
 * with guard patterns and human-readable digits underneath.
 */
export const BarcodeGraphic: React.FC<BarcodeGraphicProps> = ({
  value,
  height = 42,
  showText = true,
  showLaser = false,
  className = ''
}) => {
  const cleanCode = (value || '4710088010015').trim();

  // Deterministically generate 1D bar pattern from the barcode string
  const bars = useMemo(() => {
    // Standard 7-module patterns for digits 0-9 (inspired by EAN L-code & R-code)
    const digitPatterns = [
      '1011001', // 0
      '1100110', // 1
      '1101100', // 2
      '1000010', // 3
      '1011100', // 4
      '1001110', // 5
      '1010000', // 6
      '1000100', // 7
      '1001000', // 8
      '1110100'  // 9
    ];

    let bitString = '101'; // Left guard bars
    const chars = cleanCode.padEnd(12, '0').slice(0, 14);

    for (let i = 0; i < chars.length; i++) {
      if (i === Math.floor(chars.length / 2)) {
        bitString += '01010'; // Center guard bars
      }
      const charCode = chars.charCodeAt(i);
      const pattern = digitPatterns[charCode % 10];
      bitString += pattern;
    }

    bitString += '101'; // Right guard bars
    return bitString.split('');
  }, [cleanCode]);

  const totalUnits = bars.length;

  return (
    <div className={`inline-flex flex-col items-center select-none relative overflow-hidden ${className}`}>
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${totalUnits + 8} ${height}`}
          className="w-full max-w-[190px] h-auto"
          preserveAspectRatio="none"
        >
          <rect x="0" y="0" width={totalUnits + 8} height={height} fill="white" />
          {bars.map((bit, idx) => {
            if (bit !== '1') return null;
            // Guard bars extend slightly lower
            const isGuard =
              idx < 3 ||
              idx >= bars.length - 3 ||
              (idx >= Math.floor(bars.length / 2) - 2 && idx <= Math.floor(bars.length / 2) + 2);
            const barHeight = isGuard ? height : height - 4;
            return (
              <rect
                key={idx}
                x={idx + 4}
                y={0}
                width={1.05}
                height={barHeight}
                fill="#0f172a"
              />
            );
          })}
        </svg>

        {showLaser && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] opacity-85 pointer-events-none" />
        )}
      </div>

      {showText && (
        <div className="font-mono text-[10px] tracking-[0.18em] text-slate-700 font-bold mt-0.5 leading-none">
          {cleanCode}
        </div>
      )}
    </div>
  );
};
