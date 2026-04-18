import { useEffect, useRef, useState } from 'react';

const AGENT_CONFIG = {
  A: {
    label: 'Agent A',
    emoji: '🔴',
    colorClass: 'agent-a-border',
    accentColor: '#ef4444',
    accentBg: 'rgba(239, 68, 68, 0.08)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeText: '#f87171',
    title: 'Steelmanning Position A',
  },
  B: {
    label: 'Agent B',
    emoji: '🔵',
    colorClass: 'agent-b-border',
    accentColor: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.08)',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#60a5fa',
    title: 'Steelmanning Position B',
  },
  C: {
    label: 'Agent C',
    emoji: '⚪',
    colorClass: 'agent-c-border',
    accentColor: '#a1a1aa',
    accentBg: 'rgba(99, 102, 241, 0.06)',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeText: '#a78bfa',
    title: 'Finding Common Ground',
  },
};

const STATUS_LABELS = {
  waiting: 'WAITING',
  thinking: 'THINKING',
  concluding: 'CONCLUDING',
  complete: 'COMPLETE ✓',
};

export default function AgentPanel({ agentType, thinkingLines, conclusionText, status, animDelay = 0 }) {
  const cfg = AGENT_CONFIG[agentType];
  const thinkRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  useEffect(() => {
    if (thinkRef.current) {
      thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
    }
  }, [thinkingLines]);

  const isActive = status === 'thinking' || status === 'concluding';
  const isComplete = status === 'complete';
  const isWaiting = status === 'waiting';

  return (
    <div
      className={`glass-card rounded-2xl border ${cfg.colorClass} flex flex-col overflow-hidden transition-all duration-700`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${animDelay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${animDelay}ms`,
        minHeight: '420px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: cfg.accentBg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.emoji}</span>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: cfg.accentColor }}>
            {cfg.label}
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">— {cfg.title}</span>
        </div>
        <StatusBadge status={status} cfg={cfg} />
      </div>

      {/* Thinking feed */}
      <div className="flex flex-col" style={{ flex: '0 0 140px', position: 'relative' }}>
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <span className="text-xs font-mono tracking-widest text-zinc-600 uppercase">Reasoning</span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: cfg.accentColor }} />
          )}
        </div>

        <div
          ref={thinkRef}
          className="thinking-feed px-4 pb-3"
          style={{ height: '100px', overflowY: 'auto' }}
        >
          {isWaiting ? (
            <span className="text-zinc-700 font-mono text-xs">Waiting for agents A &amp; B to complete...</span>
          ) : thinkingLines.length === 0 && isActive ? (
            <span className="text-zinc-700 font-mono text-xs animate-pulse">Initializing reasoning engine...</span>
          ) : (
            thinkingLines.map((line, i) => (
              <div key={i} className="thinking-line" style={{ color: i < thinkingLines.length - 3 ? '#333' : '#666' }}>
                {line}
              </div>
            ))
          )}
        </div>

        {/* Animated divider */}
        <div className="relative h-px mx-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {isActive && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, ${cfg.accentColor}40, transparent)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Conclusion panel */}
      <div className="flex-1 flex flex-col px-4 py-4">
        <div className="text-xs font-mono tracking-widest text-zinc-600 uppercase mb-3">Conclusion</div>
        <div className="flex-1">
          {isWaiting ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 rounded shimmer" style={{ width: `${70 + i * 10}%` }} />
              ))}
            </div>
          ) : conclusionText ? (
            <p
              className={`text-sm leading-relaxed text-zinc-200 ${isActive && !isComplete ? 'cursor-blink' : ''}`}
              style={{ fontWeight: 400, lineHeight: 1.8 }}
            >
              {conclusionText}
            </p>
          ) : isActive ? (
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <LoadingDots color={cfg.accentColor} />
              <span style={{ color: cfg.accentColor, opacity: 0.7 }}>Reasoning...</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, cfg }) {
  const label = STATUS_LABELS[status] || 'IDLE';
  const isPulsing = status === 'thinking' || status === 'concluding';
  const isComplete = status === 'complete';

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wider"
      style={{
        background: isComplete ? 'rgba(34,197,94,0.15)' : cfg.badgeBg,
        color: isComplete ? '#4ade80' : cfg.badgeText,
      }}
    >
      {isPulsing && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: cfg.accentColor }}
        />
      )}
      {isComplete && <span>✓</span>}
      {status === 'waiting' && <span className="opacity-40">◦</span>}
      {label}
    </div>
  );
}

function LoadingDots({ color }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: color, opacity: 0.6, animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
