import { useEffect, useRef, useState } from 'react';

export default function ModeratorPanel({ status, thinkingLines, conclusion, sharedValues, visible }) {
  const thinkRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) setTimeout(() => setRendered(true), 80);
  }, [visible]);

  useEffect(() => {
    if (thinkRef.current) thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [thinkingLines]);

  if (!visible) return null;

  const isSpeaking = status === 'thinking' || status === 'concluding';
  const isDone = status === 'complete';

  return (
    <div
      style={{
        opacity: rendered ? 1 : 0,
        transform: rendered ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
        marginTop: 32,
      }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.2))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#d97706', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
            Moderator&apos;s Verdict
          </span>
          {isSpeaking && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1s infinite' }} />
          )}
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(251,191,36,0.2), transparent)' }} />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* Left: thinking + conclusion */}
        <div style={{
          background: 'rgba(251,191,36,0.03)',
          border: '1px solid rgba(251,191,36,0.12)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Thinking feed */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 14px' }}>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase', marginBottom: 6 }}>
              Reasoning
            </div>
            <div
              ref={thinkRef}
              style={{
                height: 100, overflowY: 'auto', scrollbarWidth: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10, lineHeight: 1.7, color: '#444',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
              }}
            >
              {thinkingLines.map((l, i, arr) => (
                <div key={i} style={{ color: i < arr.length - 2 ? '#2a2a2a' : '#4a4a4a' }}>{l}</div>
              ))}
              {status === 'thinking' && !thinkingLines.length && (
                <span style={{ color: '#333' }}>Deliberating...</span>
              )}
            </div>
          </div>

          {/* Conclusion */}
          <div style={{ padding: '14px' }}>
            <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase', marginBottom: 8 }}>
              Verdict
            </div>
            {conclusion ? (
              <VerdictText text={conclusion} isSpeaking={isSpeaking} />
            ) : isSpeaking ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706', opacity: 0.5, animation: `bounce 1s ${i*0.15}s ease-in-out infinite` }} />)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: shared values */}
        <div style={{
          background: 'rgba(99,102,241,0.04)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 14,
          padding: 16,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase', marginBottom: 12 }}>
            Shared Values
          </div>

          {sharedValues.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sharedValues.map((v, i) => (
                <SharedValuePill key={i} value={v} index={i} />
              ))}
            </div>
          ) : isDone && !sharedValues.length ? (
            <p style={{ fontSize: 12, color: '#52525b' }}>No shared values detected.</p>
          ) : (
            <SharedValuesSkeleton isSpeaking={isSpeaking} />
          )}

          {isDone && sharedValues.length > 0 && (
            <MiniVenn />
          )}
        </div>
      </div>
    </div>
  );
}

function VerdictText({ text, isSpeaking }) {
  // Parse bold headers like **Section:** text
  const lines = text.split('\n').filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {lines.map((line, i) => {
        const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
        if (boldMatch) {
          return (
            <div key={i} style={{ animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#d97706', textTransform: 'uppercase', marginBottom: 3 }}>
                {boldMatch[1]}
              </div>
              <p style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.7, margin: 0 }}>
                {boldMatch[2]}
                {isSpeaking && i === lines.length - 1 && (
                  <span style={{ display: 'inline-block', width: 2, height: 12, background: '#fbbf24', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
                )}
              </p>
            </div>
          );
        }
        if (line.startsWith('•')) return null; // handled in shared values
        return (
          <p key={i} style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.7, margin: 0 }}>
            {line}
            {isSpeaking && i === lines.length - 1 && (
              <span style={{ display: 'inline-block', width: 2, height: 12, background: '#fbbf24', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
            )}
          </p>
        );
      })}
    </div>
  );
}

function SharedValuePill({ value, index }) {
  const colors = ['#a78bfa', '#34d399', '#60a5fa'];
  const color = colors[index % colors.length];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        background: `${color}10`,
        border: `1px solid ${color}25`,
        animation: `slideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.2}s both`,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, marginTop: 1 }}>
        0{index + 1}
      </span>
      <span style={{ fontSize: 12.5, color: '#e4e4e7', lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

function SharedValuesSkeleton({ isSpeaking }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 38, borderRadius: 10, background: isSpeaking ? undefined : 'rgba(255,255,255,0.03)', animation: isSpeaking ? 'shimmer 1.5s linear infinite' : 'none', backgroundSize: '200% auto', backgroundImage: isSpeaking ? 'linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)' : undefined }} />
      ))}
    </div>
  );
}

function MiniVenn() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { setTimeout(() => setDrawn(true), 300); }, []);

  return (
    <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'center' }}>
      <svg width="120" height="60" viewBox="0 0 120 60">
        <defs>
          <clipPath id="modCircA"><circle cx="42" cy="30" r="26" /></clipPath>
          <radialGradient id="mgA" cx="40%" cy="50%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.25)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0.05)" />
          </radialGradient>
          <radialGradient id="mgB" cx="60%" cy="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.25)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.05)" />
          </radialGradient>
          <radialGradient id="mgOverlap">
            <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.15)" />
          </radialGradient>
        </defs>
        {drawn && <>
          <circle cx="42" cy="30" r="26" fill="url(#mgA)" />
          <circle cx="78" cy="30" r="26" fill="url(#mgB)" style={{ animation: 'fadeIn 0.5s ease 0.2s both', opacity: 0 }} />
          <g clipPath="url(#modCircA)">
            <circle cx="78" cy="30" r="26" fill="url(#mgOverlap)" style={{ animation: 'fadeIn 0.5s ease 0.5s both', opacity: 0 }} />
          </g>
          <circle cx="42" cy="30" r="26" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1"
            strokeDasharray="200" strokeDashoffset={drawn ? 0 : 200}
            style={{ transition: 'stroke-dashoffset 1.2s ease', }} />
          <circle cx="78" cy="30" r="26" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1"
            strokeDasharray="200" strokeDashoffset={drawn ? 0 : 200}
            style={{ transition: 'stroke-dashoffset 1.2s ease 0.3s', }} />
        </>}
      </svg>
    </div>
  );
}
