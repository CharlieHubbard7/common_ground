import { useEffect, useState } from 'react';

export default function RoundTransition({ round, onDone }) {
  const [phase, setPhase] = useState('enter'); // enter | hold | exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 1600);
    const t3 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const config = {
    opening:  { number: 'ROUND 1', subtitle: 'OPENING STATEMENTS', color: '#6366f1', glow: 'rgba(99,102,241,0.3)' },
    rebuttal: { number: 'ROUND 2', subtitle: 'REBUTTALS', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
    moderator:{ number: 'VERDICT', subtitle: "MODERATOR'S RULING", color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  }[round] ?? { number: 'ROUND', subtitle: '', color: '#6366f1', glow: '' };

  const isVisible = phase === 'hold';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: phase === 'exit' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.92)',
      backdropFilter: isVisible ? 'blur(12px)' : 'blur(0px)',
      transition: 'background 0.5s ease, backdrop-filter 0.5s ease',
      pointerEvents: phase === 'exit' ? 'none' : 'all',
    }}>
      {/* Horizontal scan lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
      }} />

      {/* Center content */}
      <div style={{
        textAlign: 'center',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Glow orb */}
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: config.color,
            letterSpacing: '-2px', lineHeight: 1,
            textShadow: `0 0 40px ${config.glow}`,
          }}>
            {round === 'moderator' ? '⚖️' : round === 'rebuttal' ? '⚡' : '🎙️'}
          </div>
        </div>

        <div style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900,
          color: '#fff', letterSpacing: '-2px', lineHeight: 1.05,
          marginBottom: 8,
        }}>
          {config.number}
        </div>
        <div style={{
          fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.3em', color: config.color, textTransform: 'uppercase',
        }}>
          {config.subtitle}
        </div>

        {/* Decorative line */}
        <div style={{
          width: isVisible ? 200 : 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          margin: '20px auto 0',
          transition: 'width 0.6s ease 0.2s',
        }} />
      </div>
    </div>
  );
}
