import { useEffect, useRef } from 'react';
import { detectArgumentType } from '../claude';

const SIDES = {
  A: {
    name: 'Debater A',
    color: '#ef4444',
    rgb: '239,68,68',
    dimColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.25)',
    glowColor: 'rgba(239,68,68,0.4)',
    gradFrom: 'rgba(239,68,68,0.08)',
    gradTo:   'rgba(239,68,68,0.01)',
    side: 'left',
  },
  B: {
    name: 'Debater B',
    color: '#3b82f6',
    rgb: '59,130,246',
    dimColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.25)',
    glowColor: 'rgba(59,130,246,0.4)',
    gradFrom: 'rgba(59,130,246,0.08)',
    gradTo:   'rgba(59,130,246,0.01)',
    side: 'right',
  },
};

const STATUS_LABEL = {
  idle: 'STANDBY',
  thinking: 'REASONING',
  concluding: 'ARGUING',
  complete: 'DONE ✓',
  waiting: 'WAITING',
};

export default function DebaterPanel({ side, position, rounds = {}, currentRound, visible }) {
  const cfg = SIDES[side];
  const thinkRef = useRef(null);

  // Current round data
  const current = currentRound ? rounds[currentRound] : null;
  const status = current?.status ?? 'idle';
  const isSpeaking = status === 'thinking' || status === 'concluding';
  const isComplete = status === 'complete';

  useEffect(() => {
    if (thinkRef.current) thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [current?.thinking]);

  // Collect all finished rounds for history
  const roundOrder = ['opening', 'rebuttal'];
  const pastRounds = roundOrder.filter(r => r !== currentRound && rounds[r]?.conclusion);

  const argType = current?.conclusion ? detectArgumentType(current.conclusion) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${cfg.gradFrom} 0%, ${cfg.gradTo} 100%)`,
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: 16,
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        minHeight: 480,
        position: 'relative',
      }}
    >
      {/* Glow when speaking */}
      {isSpeaking && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 16, pointerEvents: 'none',
          boxShadow: `0 0 30px ${cfg.glowColor}, 0 0 60px ${cfg.dimColor}`,
          animation: 'pulseGlow 1.5s ease-in-out infinite',
          zIndex: 0,
        }} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid rgba(${cfg.rgb},0.12)`,
        background: cfg.dimColor,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DebaterAvatar side={side} speaking={isSpeaking} color={cfg.color} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: cfg.color, textTransform: 'uppercase' }}>
              {cfg.name}
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 1, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {position}
            </div>
          </div>
        </div>
        <StatusPill status={status} color={cfg.color} rgb={cfg.rgb} />
      </div>

      {/* Waveform — visible when speaking */}
      <div style={{ height: 32, padding: '0 16px', display: 'flex', alignItems: 'center', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
        {isSpeaking ? (
          <WaveformBars color={cfg.color} />
        ) : (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{ width: 2, height: 3, borderRadius: 1, background: 'rgba(255,255,255,0.07)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Past round cards */}
      {pastRounds.map(r => (
        <PastRoundCard key={r} roundName={r} data={rounds[r]} color={cfg.color} rgb={cfg.rgb} />
      ))}

      {/* Current round area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 0 0' }}>
        {currentRound && (
          <>
            {/* Round label */}
            <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase' }}>
                {currentRound === 'opening' ? '— Opening Statement' : '— Rebuttal'}
              </span>
              {isSpeaking && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, animation: 'blink 1s step-end infinite' }} />}
            </div>

            {/* Thinking feed */}
            <div
              ref={thinkRef}
              style={{
                margin: '0 12px',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
                height: 80,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                lineHeight: 1.6,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
              }}
            >
              {(current?.thinking ?? []).map((line, i, arr) => (
                <div key={i} style={{ color: i < arr.length - 2 ? '#2d2d2d' : '#555', animation: 'slideUpFade 0.25s ease forwards' }}>
                  {line}
                </div>
              ))}
              {status === 'thinking' && !current?.thinking?.length && (
                <span style={{ color: '#333' }}>Analyzing...</span>
              )}
            </div>

            {/* Divider */}
            <div style={{ margin: '10px 12px', height: 1, background: `linear-gradient(90deg, transparent, rgba(${cfg.rgb},0.2), transparent)` }} />

            {/* Conclusion */}
            <div style={{ flex: 1, padding: '0 16px 16px' }}>
              {current?.conclusion ? (
                <p style={{
                  fontSize: 13.5, lineHeight: 1.8, color: '#e4e4e7', margin: 0,
                  fontWeight: 400,
                }}>
                  {current.conclusion}
                  {isSpeaking && <span style={{ display: 'inline-block', width: 2, height: 14, background: cfg.color, marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />}
                </p>
              ) : status === 'thinking' ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingTop: 8 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, opacity: 0.5, animation: `bounce 1s ${i*0.15}s ease-in-out infinite` }} />)}
                  <span style={{ fontSize: 12, color: '#52525b', marginLeft: 4 }}>Forming argument...</span>
                </div>
              ) : null}

              {/* Argument type badge */}
              {argType && isComplete && (
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${argType.color}15`, border: `1px solid ${argType.color}30` }}>
                  <span style={{ fontSize: 11 }}>{argType.icon}</span>
                  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: argType.color, textTransform: 'uppercase' }}>{argType.label}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PastRoundCard({ roundName, data, color, rgb }) {
  const argType = data.conclusion ? detectArgumentType(data.conclusion) : null;
  return (
    <div style={{
      margin: '8px 12px 0',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid rgba(${rgb},0.1)`,
      borderRadius: 8,
      opacity: 0.7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#3f3f46', textTransform: 'uppercase' }}>
          {roundName}
        </span>
        {argType && (
          <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 999, background: `${argType.color}15`, color: argType.color, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            {argType.icon} {argType.label}
          </span>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.65, margin: 0 }}>
        {data.conclusion}
      </p>
    </div>
  );
}

function DebaterAvatar({ side, speaking, color }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: speaking ? color : `${color}20`,
      border: `1.5px solid ${speaking ? color : `${color}40`}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: speaking ? '#fff' : color,
      transition: 'all 0.3s ease',
      boxShadow: speaking ? `0 0 16px ${color}60` : 'none',
      flexShrink: 0,
    }}>
      {side}
    </div>
  );
}

function StatusPill({ status, color, rgb }) {
  const label = STATUS_LABEL[status] || 'IDLE';
  const isActive = status === 'thinking' || status === 'concluding';
  const isDone = status === 'complete';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999,
      background: isDone ? 'rgba(34,197,94,0.1)' : isActive ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : isActive ? `rgba(${rgb},0.3)` : 'rgba(255,255,255,0.07)'}`,
      fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em',
      color: isDone ? '#4ade80' : isActive ? color : '#52525b',
      textTransform: 'uppercase',
      transition: 'all 0.3s ease',
    }}>
      {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, animation: 'pulse 1.5s infinite' }} />}
      {label}
    </div>
  );
}

function WaveformBars({ color }) {
  const heights = [4, 8, 14, 10, 18, 12, 22, 14, 20, 10, 16, 8, 18, 12, 8, 14, 10, 6, 12, 8];
  const speeds = [0.4, 0.6, 0.5, 0.7, 0.45, 0.55, 0.5, 0.65, 0.42, 0.58, 0.5, 0.62, 0.48, 0.56, 0.52, 0.44, 0.6, 0.5, 0.54, 0.46];
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 24 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2.5, borderRadius: 2,
            background: `${color}${Math.floor(40 + i * 3).toString(16)}`,
            animation: `waveBar ${speeds[i]}s ease-in-out ${(i * 0.05) % 0.4}s infinite alternate`,
            height: h,
          }}
        />
      ))}
    </div>
  );
}
