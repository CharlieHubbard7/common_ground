import { useEffect, useRef, useState } from 'react';

export default function CenterColumn({ audienceMeter, clashTerms, currentRound, statusA, statusB }) {
  // audienceMeter: 0–100 where 50 = tied, <50 = A leading, >50 = B leading
  const aPercent = Math.round(100 - audienceMeter);
  const bPercent = Math.round(audienceMeter);
  const isTied = Math.abs(aPercent - bPercent) <= 3;
  const aLeads = aPercent > bPercent + 3;
  const prevMeter = useRef(audienceMeter);
  const [flash, setFlash] = useState(null); // 'A' | 'B' | null

  useEffect(() => {
    const delta = Math.abs(audienceMeter - prevMeter.current);
    if (delta > 3) {
      setFlash(audienceMeter < prevMeter.current ? 'A' : 'B');
      const t = setTimeout(() => setFlash(null), 600);
      prevMeter.current = audienceMeter;
      return () => clearTimeout(t);
    }
    prevMeter.current = audienceMeter;
  }, [audienceMeter]);

  const isSpeaking = statusA === 'thinking' || statusA === 'concluding' || statusB === 'thinking' || statusB === 'concluding';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '24px 8px',
      position: 'relative',
    }}>
      {/* VS Badge */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', color: '#52525b',
      }}>
        VS
      </div>

      {/* Audience Meter */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase', marginBottom: 2 }}>
          Audience
        </div>

        {/* Meter bar */}
        <div style={{ width: '100%', position: 'relative' }}>
          {/* Track */}
          <div style={{
            width: '100%', height: 8, borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* A fill (left side) */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${100 - audienceMeter}%`,
              background: 'linear-gradient(90deg, #ef444480, #ef4444)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
              borderRadius: '999px 0 0 999px',
            }} />
            {/* B fill (right side) */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: `${audienceMeter}%`,
              background: 'linear-gradient(270deg, #3b82f680, #3b82f6)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
              borderRadius: '0 999px 999px 0',
            }} />
            {/* Center needle */}
            <div style={{
              position: 'absolute',
              left: `${100 - audienceMeter}%`,
              top: -2, bottom: -2, width: 2,
              background: '#fff',
              borderRadius: 999,
              transform: 'translateX(-50%)',
              transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            }} />
          </div>

          {/* Flash highlight when meter swings */}
          {flash && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 999,
              background: flash === 'A' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
              animation: 'flashFade 0.6s ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Percentage labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums', transition: 'all 0.3s' }}>
            {aPercent}%
          </span>
          <span style={{ fontSize: 9, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>
            {isTied ? 'TIED' : aLeads ? '🔴 LEADS' : '🔵 LEADS'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', fontVariantNumeric: 'tabular-nums', transition: 'all 0.3s' }}>
            {bPercent}%
          </span>
        </div>
      </div>

      {/* Divider line */}
      <div style={{
        width: 1, height: 40,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)',
      }} />

      {/* Round label */}
      {currentRound && (
        <div style={{
          padding: '6px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase' }}>
            {currentRound === 'opening' ? 'Round 1' : currentRound === 'rebuttal' ? 'Round 2' : 'Verdict'}
          </div>
          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2, fontWeight: 500 }}>
            {currentRound === 'opening' ? 'Opening' : currentRound === 'rebuttal' ? 'Rebuttal' : 'Moderator'}
          </div>
        </div>
      )}

      {/* Clash indicator */}
      {clashTerms.length > 0 && (
        <ClashIndicator terms={clashTerms} />
      )}

      {/* Live indicator */}
      {isSpeaking && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 8px', borderRadius: 999,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: '#ef4444', letterSpacing: '0.15em' }}>LIVE</span>
        </div>
      )}
    </div>
  );
}

function ClashIndicator({ terms }) {
  return (
    <div style={{
      textAlign: 'center',
      animation: 'clashIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
    }}>
      <div style={{
        fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
        color: '#fbbf24', fontWeight: 700,
        padding: '4px 8px', borderRadius: 6,
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.25)',
        marginBottom: 4,
      }}>
        ⚡ CLASH
      </div>
      {terms.slice(0, 2).map((t, i) => (
        <div key={i} style={{ fontSize: 9, color: '#78716c', fontFamily: 'monospace' }}>{t}</div>
      ))}
    </div>
  );
}
