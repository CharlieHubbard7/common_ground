import { useEffect, useRef, useState } from 'react';
import { parseReportSections, parseSharedValues } from '../claude';

const SECTION_STYLES = {
  'Overview':                    { icon: '📋', color: '#a1a1aa', accent: 'rgba(161,161,170,0.1)',  border: 'rgba(161,161,170,0.15)' },
  'default-A':                   { icon: '🔴', color: '#ef4444', accent: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.15)'  },
  'default-B':                   { icon: '🔵', color: '#3b82f6', accent: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
  'Where They Actually Agree':   { icon: '🤝', color: '#a78bfa', accent: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)'  },
  'The Real Point of Disagreement': { icon: '⚡', color: '#f59e0b', accent: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)' },
  'Why This Debate Matters':     { icon: '🌐', color: '#34d399', accent: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.15)' },
};

function getSectionStyle(header, index) {
  if (SECTION_STYLES[header]) return SECTION_STYLES[header];
  if (/strongest case for/i.test(header)) {
    return index <= 2 ? SECTION_STYLES['default-A'] : SECTION_STYLES['default-B'];
  }
  return SECTION_STYLES['Overview'];
}

export default function ModeratorReport({ status, thinking, conclusion, visible }) {
  const thinkRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (visible) setTimeout(() => setShown(true), 60);
  }, [visible]);

  useEffect(() => {
    if (thinkRef.current) thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [thinking]);

  if (!visible) return null;

  const isSpeaking = status === 'streaming';
  const isDone = status === 'complete';
  const sections = isDone ? parseReportSections(conclusion) : [];
  const sharedValues = isDone ? parseSharedValues(conclusion) : [];

  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        marginTop: 40,
      }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.25))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚖️</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#d97706', textTransform: 'uppercase' }}>Moderator's Report</div>
            <div style={{ fontSize: 9, color: '#52525b', marginTop: 1 }}>Nonpartisan analysis · AI-generated</div>
          </div>
          {isSpeaking && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.2s infinite', marginLeft: 4 }} />}
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(217,119,6,0.25), transparent)' }} />
      </div>

      {/* Thinking feed — visible while streaming */}
      {(isSpeaking || (isDone && thinking && thinking.length > 0)) && (
        <ThinkingFeed thinkRef={thinkRef} thinking={thinking} isSpeaking={isSpeaking} />
      )}

      {/* Streaming raw text — before done */}
      {isSpeaking && (
        <div style={{
          borderRadius: 14, border: '1px solid rgba(217,119,6,0.18)',
          background: 'rgba(217,119,6,0.04)', padding: '20px 22px', marginTop: 12,
        }}>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#e4e4e7', margin: 0, whiteSpace: 'pre-wrap' }}>
            {conclusion}
            <span style={{ display: 'inline-block', width: 2, height: 14, background: '#fbbf24', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }} />
          </p>
        </div>
      )}

      {/* Parsed sections — when done */}
      {isDone && sections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((sec, i) => (
            <ReportSection key={i} section={sec} index={i} sharedValues={sharedValues} />
          ))}
        </div>
      )}

      {/* Loading state */}
      {status === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: '#3f3f46', fontSize: 13 }}>
          {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', opacity: 0.4, animation: `bounce 1s ${i*0.15}s infinite` }} />)}
          <span>Preparing verdict...</span>
        </div>
      )}
    </div>
  );
}

function ThinkingFeed({ thinkRef, thinking, isSpeaking }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
      <button onClick={() => setCollapsed(c => !c)} style={{ width: '100%', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase' }}>
          {collapsed ? '▶ SHOW' : '▼ HIDE'} MODERATOR REASONING
        </span>
        {isSpeaking && !collapsed && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d97706', animation: 'pulse 1.5s infinite' }} />}
      </button>
      {!collapsed && (
        <div
          ref={thinkRef}
          style={{
            maxHeight: 200, overflowY: 'auto', padding: '10px 14px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, lineHeight: 1.75,
            color: '#4a4a4a', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent',
          }}
        >
          {thinking}
          {isSpeaking && thinking && (
            <span style={{ display: 'inline-block', width: 2, height: 11, background: '#d97706', marginLeft: 1, animation: 'blink 1s step-end infinite', verticalAlign: 'middle', opacity: 0.6 }} />
          )}
        </div>
      )}
    </div>
  );
}

function ReportSection({ section, index, sharedValues }) {
  const style = getSectionStyle(section.header, index);
  const isSharedValues = /agree|common ground|share/i.test(section.header);
  const hasValues = isSharedValues && sharedValues.length > 0;

  // Parse body: split into paragraphs and bullets
  const lines = section.body.split('\n').filter(Boolean);

  return (
    <div
      style={{
        borderRadius: 14, border: `1px solid ${style.border}`,
        background: style.accent, overflow: 'hidden',
        animation: `slideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.08}s both`,
      }}
    >
      {/* Section header */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${style.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{style.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: style.color, letterSpacing: '0.04em' }}>{section.header}</span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lines.map((line, i) => {
          if (line.startsWith('•')) {
            const text = line.replace(/^•\s*/, '');
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: `${style.color}0d`, border: `1px solid ${style.color}20`, animation: `slideUp 0.4s ease ${i * 0.07}s both` }}>
                <span style={{ color: style.color, fontSize: 12, marginTop: 1, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 13.5, color: '#e4e4e7', lineHeight: 1.7 }}>{text}</span>
              </div>
            );
          }
          return (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.85, color: '#d4d4d8', margin: 0 }}>{line}</p>
          );
        })}
      </div>
    </div>
  );
}
