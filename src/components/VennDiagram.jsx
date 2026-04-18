import { useEffect, useState } from 'react';

export default function VennDiagram({ sharedValues, positionA, positionB, visible }) {
  const [drawn, setDrawn] = useState(false);
  const [valuesVisible, setValuesVisible] = useState([]);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t1);
  }, [visible]);

  useEffect(() => {
    if (!drawn || !sharedValues?.length) return;
    sharedValues.forEach((_, i) => {
      setTimeout(() => {
        setValuesVisible((prev) => [...prev, i]);
      }, 800 + i * 400);
    });
  }, [drawn, sharedValues]);

  if (!visible) return null;

  const cx1 = 145, cx2 = 255, cy = 140, r = 110;

  return (
    <div
      className="flex flex-col items-center gap-8 py-8"
      style={{ animation: 'fadeIn 0.8s ease-out forwards' }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Where You Meet</h2>
        <p className="text-zinc-500 text-sm max-w-md">
          Beneath the disagreement, these core human values appear on both sides.
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        <svg
          width="400"
          height="280"
          viewBox="0 0 400 280"
          className="overflow-visible"
          style={{ maxWidth: '100%' }}
        >
          <defs>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-blue">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-purple">
              <feGaussianBlur stdDeviation="12" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="circleA">
              <circle cx={cx1} cy={cy} r={r} />
            </clipPath>
            <clipPath id="circleB">
              <circle cx={cx2} cy={cy} r={r} />
            </clipPath>
            <radialGradient id="fillA" cx="40%" cy="50%">
              <stop offset="0%" stopColor="rgba(239,68,68,0.18)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.04)" />
            </radialGradient>
            <radialGradient id="fillB" cx="60%" cy="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.18)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.04)" />
            </radialGradient>
            <radialGradient id="fillOverlap" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.15)" />
            </radialGradient>
          </defs>

          {/* Circle A fill */}
          {drawn && (
            <circle
              cx={cx1} cy={cy} r={r}
              fill="url(#fillA)"
              style={{ animation: 'fadeIn 1s ease-out forwards' }}
            />
          )}

          {/* Circle B fill */}
          {drawn && (
            <circle
              cx={cx2} cy={cy} r={r}
              fill="url(#fillB)"
              style={{ animation: 'fadeIn 1s ease-out 0.2s forwards', opacity: 0 }}
            />
          )}

          {/* Overlap fill using clip */}
          {drawn && (
            <g clipPath="url(#circleA)">
              <circle
                cx={cx2} cy={cy} r={r}
                fill="url(#fillOverlap)"
                style={{ animation: 'fadeIn 1.2s ease-out 0.6s forwards', opacity: 0 }}
              />
            </g>
          )}

          {/* Circle A stroke */}
          <circle
            cx={cx1} cy={cy} r={r}
            fill="none"
            stroke="rgba(239,68,68,0.5)"
            strokeWidth="1.5"
            className={drawn ? 'venn-path' : ''}
            style={drawn ? { animationDuration: '1.5s' } : { opacity: 0 }}
            filter="url(#glow-red)"
          />

          {/* Circle B stroke */}
          <circle
            cx={cx2} cy={cy} r={r}
            fill="none"
            stroke="rgba(59,130,246,0.5)"
            strokeWidth="1.5"
            className={drawn ? 'venn-path' : ''}
            style={drawn ? { animationDuration: '1.5s', animationDelay: '0.3s' } : { opacity: 0 }}
            filter="url(#glow-blue)"
          />

          {/* Labels */}
          {drawn && (
            <>
              <text
                x={cx1 - 42} y={cy + r + 26}
                textAnchor="middle"
                fill="rgba(239,68,68,0.7)"
                fontSize="11"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
                style={{ animation: 'fadeIn 0.8s ease-out 1s forwards', opacity: 0 }}
              >
                {truncate(positionA, 20)}
              </text>
              <text
                x={cx2 + 42} y={cy + r + 26}
                textAnchor="middle"
                fill="rgba(59,130,246,0.7)"
                fontSize="11"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
                style={{ animation: 'fadeIn 0.8s ease-out 1.1s forwards', opacity: 0 }}
              >
                {truncate(positionB, 20)}
              </text>

              {/* Overlap label */}
              <text
                x={200} y={cy - 10}
                textAnchor="middle"
                fill="rgba(167,139,250,0.9)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1"
                style={{ animation: 'fadeIn 0.8s ease-out 1.4s forwards', opacity: 0 }}
              >
                SHARED
              </text>
              <text
                x={200} y={cy + 6}
                textAnchor="middle"
                fill="rgba(167,139,250,0.9)"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1"
                style={{ animation: 'fadeIn 0.8s ease-out 1.5s forwards', opacity: 0 }}
              >
                VALUES
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Shared values list */}
      {sharedValues && sharedValues.length > 0 && (
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {sharedValues.map((value, i) => (
            <div
              key={i}
              className="glass-card rounded-xl px-5 py-3.5 flex items-start gap-3"
              style={{
                borderColor: 'rgba(139,92,246,0.2)',
                opacity: valuesVisible.includes(i) ? 1 : 0,
                transform: valuesVisible.includes(i) ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <span
                className="text-xs font-mono mt-0.5 flex-shrink-0"
                style={{ color: '#a78bfa' }}
              >
                0{i + 1}
              </span>
              <span className="text-sm text-zinc-200 leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
