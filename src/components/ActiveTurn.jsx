import { useEffect, useRef, useState } from 'react';

const CFG = {
  A:   { color: '#ef4444', rgb: '239,68,68',  name: 'Debater A', glow: 'rgba(239,68,68,0.2)',  bg: 'rgba(239,68,68,0.05)'  },
  B:   { color: '#3b82f6', rgb: '59,130,246', name: 'Debater B', glow: 'rgba(59,130,246,0.2)', bg: 'rgba(59,130,246,0.05)' },
  mod: { color: '#d97706', rgb: '217,119,6',  name: 'Moderator',  glow: 'rgba(217,119,6,0.2)',  bg: 'rgba(217,119,6,0.04)'  },
};

export default function ActiveTurn({ agent, label, roundLabel, thinking, conclusion, status }) {
  const cfg = CFG[agent] || CFG.mod;
  const thinkRef = useRef(null);
  const isSpeaking = status === 'streaming';
  const isThinking = isSpeaking && !conclusion;

  useEffect(() => {
    if (thinkRef.current) thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [thinking]);

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid rgba(${cfg.rgb},0.35)`,
        background: cfg.bg,
        overflow: 'hidden',
        boxShadow: isSpeaking ? `0 0 0 1px rgba(${cfg.rgb},0.2), 0 0 40px rgba(${cfg.rgb},0.12)` : 'none',
        transition: 'box-shadow 0.4s ease',
        animation: 'slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid rgba(${cfg.rgb},0.12)`,
        background: `rgba(${cfg.rgb},0.07)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: isSpeaking ? cfg.color : `rgba(${cfg.rgb},0.2)`,
            border: `1.5px solid ${isSpeaking ? cfg.color : `rgba(${cfg.rgb},0.4)`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: isSpeaking ? '#fff' : cfg.color,
            boxShadow: isSpeaking ? `0 0 20px rgba(${cfg.rgb},0.5)` : 'none',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}>
            {agent === 'mod' ? '⚖' : agent}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, letterSpacing: '-0.2px' }}>
              {cfg.name}
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 1 }}>
              {roundLabel} · {label}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: isSpeaking ? `rgba(${cfg.rgb},0.12)` : 'rgba(34,197,94,0.1)',
          border: `1px solid ${isSpeaking ? `rgba(${cfg.rgb},0.3)` : 'rgba(34,197,94,0.25)'}`,
          fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em',
          color: isSpeaking ? cfg.color : '#4ade80',
          textTransform: 'uppercase',
        }}>
          {isSpeaking
            ? <><span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, animation: 'pulse 1.2s infinite' }} /> {isThinking ? 'REASONING' : 'ARGUING'}</>
            : <><span>✓</span> DONE</>
          }
        </div>
      </div>

      {/* Thinking feed */}
      <ThinkingBlock thinkRef={thinkRef} thinking={thinking} isThinking={isThinking} color={cfg.color} />

      {/* Divider with glow */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(${cfg.rgb},0.3), transparent)` }} />

      {/* Waveform bar */}
      {isSpeaking && (
        <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', gap: 2 }}>
          {[...Array(28)].map((_, i) => {
            const h = [3,6,11,8,16,10,20,13,18,9,14,7,19,11,16,8,13,10,17,7,12,9,15,8,11,6,9,5][i] || 4;
            const speed = [0.4,0.5,0.6,0.45,0.55,0.5,0.65,0.42,0.58,0.52,0.48,0.44,0.6,0.5,0.54,0.46,0.52,0.48,0.56,0.44,0.5,0.6,0.42,0.54,0.46,0.58,0.5,0.44][i] || 0.5;
            return <div key={i} style={{ width: 2, borderRadius: 1, background: `rgba(${cfg.rgb},0.4)`, animation: `waveBar ${speed}s ease-in-out ${(i*0.04)%0.3}s infinite alternate`, height: h }} />;
          })}
        </div>
      )}

      {/* Conclusion */}
      <div style={{ padding: '14px 18px 18px' }}>
        {conclusion ? (
          <p style={{ fontSize: 15, lineHeight: 1.85, color: '#f0f0f0', margin: 0, fontWeight: 400 }}>
            {conclusion}
            {isSpeaking && (
              <span style={{ display: 'inline-block', width: 2, height: 15, background: cfg.color, marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
            )}
          </p>
        ) : isSpeaking ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, opacity: 0.5, animation: `bounce 1s ${i*0.15}s ease-in-out infinite` }} />)}
            <span style={{ fontSize: 12, color: '#3f3f46' }}>Forming argument...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ThinkingBlock({ thinkRef, thinking, isThinking, color }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Header row — always visible */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ width: '100%', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.03)' }}
      >
        <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase' }}>
          {collapsed ? '▶' : '▼'} Internal Reasoning
        </span>
        {isThinking && (
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: color, opacity: 0.6, animation: 'pulse 1.5s infinite' }} />
        )}
        {thinking && !collapsed && (
          <span style={{ marginLeft: 'auto', fontSize: 8, color: '#27272a', fontFamily: 'JetBrains Mono, monospace' }}>
            {thinking.length} chars
          </span>
        )}
      </button>

      {!collapsed && (
        <div
          ref={thinkRef}
          style={{
            maxHeight: 160,
            overflowY: 'auto',
            padding: '10px 18px 12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11.5,
            lineHeight: 1.75,
            color: '#4a4a4a',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            scrollbarWidth: 'thin',
            scrollbarColor: '#27272a transparent',
          }}
        >
          {thinking || (isThinking ? <span style={{ color: '#2a2a2a' }}>Analyzing...</span> : null)}
          {isThinking && thinking && (
            <span style={{ display: 'inline-block', width: 2, height: 11, background: color, marginLeft: 1, animation: 'blink 1s step-end infinite', verticalAlign: 'middle', opacity: 0.6 }} />
          )}
        </div>
      )}
    </div>
  );
}
