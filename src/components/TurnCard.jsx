import { useState } from 'react';
import { detectArgumentType } from '../claude';

const CFG = {
  A:   { color: '#ef4444', rgb: '239,68,68', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.18)',  name: 'Debater A', align: 'left'  },
  B:   { color: '#3b82f6', rgb: '59,130,246', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', name: 'Debater B', align: 'right' },
};

export default function TurnCard({ agent, label, roundLabel, thinking, conclusion, turnNumber, totalTurns, visible }) {
  const [showThinking, setShowThinking] = useState(false);
  const cfg = CFG[agent];
  const argType = conclusion ? detectArgumentType(conclusion) : null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: cfg.align === 'right' ? 'flex-end' : 'flex-start',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div
        style={{
          maxWidth: '78%',
          width: '100%',
          borderRadius: 14,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          overflow: 'hidden',
          borderLeft: cfg.align === 'left'  ? `3px solid ${cfg.color}` : undefined,
          borderRight: cfg.align === 'right' ? `3px solid ${cfg.color}` : undefined,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: `rgba(${cfg.rgb},0.15)`,
              border: `1px solid rgba(${cfg.rgb},0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: cfg.color,
            }}>{agent}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cfg.name}</div>
              <div style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.05em' }}>{roundLabel} · {label}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {argType && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${argType.color}12`, border: `1px solid ${argType.color}25` }}>
                <span style={{ fontSize: 9 }}>{argType.icon}</span>
                <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: argType.color, letterSpacing: '0.1em' }}>{argType.label.toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: 9, color: '#27272a', fontFamily: 'JetBrains Mono, monospace' }}>{turnNumber}/{totalTurns}</span>
          </div>
        </div>

        {/* Conclusion */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#e4e4e7', margin: 0, fontWeight: 400 }}>
            {conclusion}
          </p>
        </div>

        {/* Thinking toggle */}
        {thinking && thinking.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => setShowThinking(s => !s)}
              style={{ width: '100%', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#3f3f46', letterSpacing: '0.15em' }}>
                {showThinking ? '▲ HIDE REASONING' : '▼ SHOW REASONING'}
              </span>
            </button>
            {showThinking && (
              <div style={{
                padding: '10px 16px 14px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5, lineHeight: 1.75, color: '#4a4a4a',
                borderTop: '1px solid rgba(255,255,255,0.03)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 240, overflowY: 'auto',
                scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent',
              }}>
                {thinking}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
