import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import TurnCard from './components/TurnCard';
import ActiveTurn from './components/ActiveTurn';
import ModeratorReport from './components/ModeratorReport';
import { streamDebateAgent, detectClash, parseSharedValues } from './claude';
import './index.css';

// ── Turn sequence ──────────────────────────────────────────────────────────
const TURNS = [
  { id: 'openingA',  agent: 'A',   round: 'opening',  roundLabel: 'Round 1', label: 'Opening Statement' },
  { id: 'openingB',  agent: 'B',   round: 'opening',  roundLabel: 'Round 1', label: 'Opening Statement' },
  { id: 'rebuttalA', agent: 'A',   round: 'rebuttal', roundLabel: 'Round 2', label: 'Rebuttal'          },
  { id: 'rebuttalB', agent: 'B',   round: 'rebuttal', roundLabel: 'Round 2', label: 'Rebuttal'          },
  { id: 'moderator', agent: 'mod', round: 'verdict',  roundLabel: 'Verdict', label: "Moderator's Report" },
];

const NEXT_BUTTON_LABELS = [
  'Continue — B\'s Opening →',
  'Round 2: A\'s Rebuttal →',
  'Continue — B\'s Rebuttal →',
  'See the Moderator\'s Verdict →',
  null,
];

// ── Presets ────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Gun Control', icon: '🔫', a: 'We need stricter gun control laws to prevent mass shootings', b: 'The Second Amendment is an absolute right that must not be infringed' },
  { label: 'Immigration', icon: '🌎', a: 'We must have open and welcoming immigration policies',          b: 'We need strong border security and strict immigration enforcement'   },
  { label: 'Healthcare',  icon: '🏥', a: 'Universal healthcare is a fundamental human right',             b: 'Free market competition produces the best healthcare outcomes'        },
  { label: 'Climate',     icon: '🌍', a: 'We need urgent government action to address the climate crisis', b: 'Climate regulations destroy jobs and hurt the economy'               },
  { label: 'Education',   icon: '🎓', a: 'Public schools need more federal funding and oversight',         b: 'School choice and local control produce better outcomes'             },
];

// ── Reducer ────────────────────────────────────────────────────────────────
const BLANK = { thinking: '', conclusion: '', status: 'idle' };

const INIT = {
  phase: 'landing',        // landing | debate | done
  turnIdx: -1,             // 0–4, -1 = not started
  turnStatus: 'idle',      // idle | streaming | ready
  data: {
    openingA:  { ...BLANK },
    openingB:  { ...BLANK },
    rebuttalA: { ...BLANK },
    rebuttalB: { ...BLANK },
    moderator: { ...BLANK },
  },
  audienceMeter: 50,
  clashTerms: [],
  error: '',
};

function reducer(s, a) {
  switch (a.type) {
    case 'START':
      return { ...INIT, phase: 'debate', turnIdx: 0, turnStatus: 'streaming', data: { ...INIT.data, [TURNS[0].id]: { ...BLANK, status: 'streaming' } } };
    case 'ADVANCE': {
      const next = s.turnIdx + 1;
      if (next >= TURNS.length) return { ...s, phase: 'done', turnStatus: 'idle' };
      const id = TURNS[next].id;
      return { ...s, turnIdx: next, turnStatus: 'streaming', data: { ...s.data, [id]: { ...BLANK, status: 'streaming' } } };
    }
    case 'TURN_READY':
      return { ...s, turnStatus: 'ready', data: { ...s.data, [a.id]: { ...s.data[a.id], status: 'complete' } } };
    case 'THINKING': {
      const prev = s.data[a.id].thinking;
      return { ...s, data: { ...s.data, [a.id]: { ...s.data[a.id], thinking: prev + a.chunk } } };
    }
    case 'CONCLUSION': {
      const prev = s.data[a.id].conclusion;
      return { ...s, data: { ...s.data, [a.id]: { ...s.data[a.id], conclusion: prev + a.chunk, status: 'streaming' } } };
    }
    case 'TICK_METER': {
      const turn = s.turnIdx >= 0 ? TURNS[s.turnIdx] : null;
      let drift = (Math.random() - 0.5) * 1.0;
      if (s.turnStatus === 'streaming' && turn) {
        if (turn.agent === 'A') drift -= 1.1;
        if (turn.agent === 'B') drift += 1.1;
      }
      return { ...s, audienceMeter: Math.max(5, Math.min(95, s.audienceMeter + drift)) };
    }
    case 'SET_CLASH':  return { ...s, clashTerms: a.payload };
    case 'SET_ERROR':  return { ...s, error: a.payload };
    case 'RESET':      return { ...INIT };
    default:           return s;
  }
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [posA, setPosA] = useState('');
  const [posB, setPosB] = useState('');
  const [apiKey, setApiKey] = useState('');
  const conclusionsRef = useRef({ openingA: '', openingB: '', rebuttalA: '', rebuttalB: '' });
  const bottomRef = useRef(null);

  // Audience meter tick
  useEffect(() => {
    if (s.phase === 'landing') return;
    const id = setInterval(() => dispatch({ type: 'TICK_METER' }), 200);
    return () => clearInterval(id);
  }, [s.phase]);

  // Scroll to bottom when a new turn starts
  useEffect(() => {
    if (s.turnIdx >= 0 && bottomRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [s.turnIdx]);

  // ── Stream a single turn ──────────────────────────────────────────────
  const streamTurn = useCallback((turnIdx) => {
    const turn = TURNS[turnIdx];
    const { id, agent, round } = turn;

    const ctx = {
      openingA:  conclusionsRef.current.openingA,
      openingB:  conclusionsRef.current.openingB,
      rebuttalA: conclusionsRef.current.rebuttalA,
      rebuttalB: conclusionsRef.current.rebuttalB,
    };

    streamDebateAgent({
      agentType: agent, round,
      positionA: posA, positionB: posB,
      ctx, apiKey,
      onThinkingChunk: (chunk) => {
        dispatch({ type: 'THINKING', id, chunk });
      },
      onConclusionChunk: (chunk) => {
        dispatch({ type: 'CONCLUSION', id, chunk });
        if (agent !== 'mod') conclusionsRef.current[id] += chunk;
      },
      onDone: (conclusion) => {
        if (agent !== 'mod') conclusionsRef.current[id] = conclusion;
        // Clash detection after second rebuttal
        if (id === 'rebuttalB') {
          const clash = detectClash(conclusionsRef.current.rebuttalA, conclusionsRef.current.rebuttalB);
          if (clash.length) dispatch({ type: 'SET_CLASH', payload: clash });
        }
        dispatch({ type: 'TURN_READY', id });
      },
      onError: (msg) => {
        dispatch({ type: 'SET_ERROR', payload: msg });
        dispatch({ type: 'TURN_READY', id });
      },
    });
  }, [posA, posB, apiKey]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!posA.trim() || !posB.trim()) { dispatch({ type: 'SET_ERROR', payload: 'Please fill in both positions.' }); return; }
    if (!apiKey.trim()) { dispatch({ type: 'SET_ERROR', payload: 'Please enter your Anthropic API key.' }); return; }
    conclusionsRef.current = { openingA: '', openingB: '', rebuttalA: '', rebuttalB: '' };
    dispatch({ type: 'START' });
    // Start turn 0 immediately
    setTimeout(() => streamTurn(0), 50);
  };

  const handleContinue = () => {
    const nextIdx = s.turnIdx + 1;
    if (nextIdx >= TURNS.length) { dispatch({ type: 'ADVANCE' }); return; }
    dispatch({ type: 'ADVANCE' });
    setTimeout(() => streamTurn(nextIdx), 50);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setPosA(''); setPosB('');
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const { data, turnIdx, turnStatus, audienceMeter, clashTerms, phase, error } = s;
  const currentTurn = turnIdx >= 0 ? TURNS[turnIdx] : null;
  const completedTurns = TURNS.slice(0, turnIdx);
  const aPercent = Math.round(100 - audienceMeter);
  const bPercent = Math.round(audienceMeter);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div className="dot-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-20%', left: '15%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* ── Nav ── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
          <button onClick={phase !== 'landing' ? handleReset : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="7" r="3" fill="white" opacity="0.5"/><circle cx="10" cy="7" r="3" fill="white" opacity="0.5"/></svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.3px' }}>Common Ground</span>
          </button>

          {phase !== 'landing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mini audience meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{aPercent}%</span>
                <div style={{ width: 80, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${aPercent}%`, background: 'linear-gradient(90deg, #ef4444, #ef444480)', transition: 'width 0.4s ease', borderRadius: '999px 0 0 999px' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${bPercent}%`, background: 'linear-gradient(270deg, #3b82f6, #3b82f680)', transition: 'width 0.4s ease', borderRadius: '0 999px 999px 0' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>{bPercent}%</span>
              </div>
              <button onClick={handleReset} style={{ fontSize: 10, color: '#52525b', background: 'none', border: '1px solid #27272a', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>↩ RESET</button>
            </div>
          )}
        </nav>

        {/* ── Landing ── */}
        {phase === 'landing' && (
          <LandingPage posA={posA} setPosA={setPosA} posB={posB} setPosB={setPosB}
            apiKey={apiKey} setApiKey={setApiKey}
            onStart={handleStart} onPreset={(p) => { setPosA(p.a); setPosB(p.b); }}
            error={error}
          />
        )}

        {/* ── Debate ── */}
        {phase !== 'landing' && (
          <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '0 16px 64px' }}>

            {/* Debate header */}
            <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔴 {posA}</span>
                <span style={{ fontSize: 11, color: '#27272a', fontWeight: 700 }}>DEBATES</span>
                <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#3b82f6', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔵 {posB}</span>
              </div>

              {/* Round progress */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                {[
                  { label: 'Opening', turns: [0,1] },
                  { label: 'Rebuttal', turns: [2,3] },
                  { label: 'Verdict', turns: [4] },
                ].map((group, gi) => {
                  const doneTurns = group.turns.filter(t => t < turnIdx || (t === turnIdx && turnStatus === 'ready' && t === TURNS.length - 1));
                  const activeTurns = group.turns.filter(t => t === turnIdx);
                  const isDone = doneTurns.length === group.turns.length || (group.turns.every(t => t <= turnIdx) && !(group.turns.includes(turnIdx) && turnStatus !== 'ready'));
                  const isActive = activeTurns.length > 0;
                  return (
                    <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999,
                        background: isActive ? 'rgba(99,102,241,0.12)' : isDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : isDone ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)'}`,
                        fontSize: 10, color: isActive ? '#a78bfa' : isDone ? '#4ade80' : '#3f3f46',
                      }}>
                        {isDone && !isActive ? '✓ ' : isActive ? <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.5s infinite', display: 'inline-block', marginRight: 3 }} /> : ''}
                        {group.label}
                      </div>
                      {gi < 2 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.08)' }} />}
                    </div>
                  );
                })}
              </div>

              {/* Audience meter — full width */}
              {turnIdx >= 0 && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{aPercent}%</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${aPercent}%`, background: 'linear-gradient(90deg, #ef444490, #ef4444)', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', borderRadius: '999px 0 0 999px' }} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${bPercent}%`, background: 'linear-gradient(270deg, #3b82f690, #3b82f6)', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', borderRadius: '0 999px 999px 0' }} />
                    <div style={{ position: 'absolute', left: `${aPercent}%`, top: -1, bottom: -1, width: 2, background: '#fff', borderRadius: 999, transform: 'translateX(-50%)', transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', width: 32, fontVariantNumeric: 'tabular-nums' }}>{bPercent}%</span>
                </div>
              )}

              {/* Clash */}
              {clashTerms.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', animation: 'clashIn 0.4s ease both' }}>
                    <span style={{ fontSize: 10 }}>⚡</span>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24', letterSpacing: '0.1em' }}>CLASH DETECTED: {clashTerms.join(' · ')}</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: 12 }}>{error}</div>
            )}

            {/* ── Completed turns transcript ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: currentTurn ? 20 : 0 }}>
              {completedTurns.map((turn, i) => (
                <div key={turn.id}>
                  {/* Round divider */}
                  {(i === 2) && (
                    <RoundDivider label="Round 2 — Rebuttals" />
                  )}
                  <TurnCard
                    agent={turn.agent}
                    label={turn.label}
                    roundLabel={turn.roundLabel}
                    thinking={data[turn.id].thinking}
                    conclusion={data[turn.id].conclusion}
                    turnNumber={i + 1}
                    totalTurns={4}
                    visible={true}
                  />
                </div>
              ))}
            </div>

            {/* ── Active turn ── */}
            {currentTurn && turnIdx < 4 && (
              <div ref={bottomRef}>
                {turnIdx === 2 && completedTurns.length === 2 && (
                  <RoundDivider label="Round 2 — Rebuttals" />
                )}
                <ActiveTurn
                  agent={currentTurn.agent}
                  label={currentTurn.label}
                  roundLabel={currentTurn.roundLabel}
                  thinking={data[currentTurn.id].thinking}
                  conclusion={data[currentTurn.id].conclusion}
                  status={turnStatus === 'streaming' ? 'streaming' : 'complete'}
                />
              </div>
            )}

            {/* ── Continue button ── */}
            {turnStatus === 'ready' && turnIdx < 4 && (
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', animation: 'slideUp 0.4s ease both' }}>
                <button
                  onClick={handleContinue}
                  style={{
                    padding: '13px 32px', borderRadius: 12, border: 'none',
                    background: turnIdx === 3 ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    boxShadow: turnIdx === 3 ? '0 0 30px rgba(217,119,6,0.3)' : '0 0 30px rgba(99,102,241,0.3)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    letterSpacing: '-0.2px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {NEXT_BUTTON_LABELS[turnIdx]}
                </button>
              </div>
            )}

            {/* ── Moderator verdict turn ── */}
            {turnIdx === 4 && (
              <div ref={turnIdx === 4 ? bottomRef : null}>
                <ModeratorReport
                  visible={true}
                  status={turnStatus === 'streaming' ? 'streaming' : data.moderator.status}
                  thinking={data.moderator.thinking}
                  conclusion={data.moderator.conclusion}
                />
              </div>
            )}

            {/* ── Share button at end ── */}
            {data.moderator.status === 'complete' && (
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', animation: 'slideUp 0.5s ease both' }}>
                <ShareButton posA={posA} posB={posB} />
              </div>
            )}
          </main>
        )}

        <footer style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 'auto' }}>
          <p style={{ fontSize: 11, color: '#27272a', margin: 0 }}>
            Inspired by Dario Amodei&apos;s <em>Machines of Loving Grace</em> · Built for Anthropic&apos;s AI Hackathon
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Landing Page ───────────────────────────────────────────────────────────
function LandingPage({ posA, setPosA, posB, setPosB, apiKey, setApiKey, onStart, onPreset, error }) {
  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 72px', maxWidth: 820, margin: '0 auto', width: '100%' }}>

      {/* ── Mission intro ── */}
      <div
        className="glass-card"
        style={{ width: '100%', borderRadius: 16, padding: '24px 28px', marginBottom: 44, borderColor: 'rgba(99,102,241,0.15)', animation: 'slideUp 0.6s ease both' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🕊️</div>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#6366f1', textTransform: 'uppercase', marginBottom: 8 }}>
              About This Project
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: '#a1a1aa', margin: '0 0 10px' }}>
              Inspired by Dario Amodei's essay <em style={{ color: '#c4b5fd' }}>Machines of Loving Grace</em> — which envisions AI helping{' '}
              <strong style={{ color: '#e4e4e7', fontWeight: 500 }}>strengthen democracy</strong> and{' '}
              <strong style={{ color: '#e4e4e7', fontWeight: 500 }}>help people find meaning</strong> — this tool was built for Anthropic's hackathon on the theme of AI amplifying human creativity and cultural expression.
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: '#71717a', margin: 0 }}>
              As AI handles more routine work, understanding people we disagree with becomes one of the most urgent human challenges.{' '}
              <strong style={{ color: '#a1a1aa', fontWeight: 500 }}>Common Ground</strong> uses three AI agents to help you genuinely read both sides of contested political debates — turn by turn, argument by argument — so you can form your own view.
            </p>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'slideUp 0.7s ease 0.05s both' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, margin: '0 0 14px', color: '#fff' }}>
          The AI Debate
        </h1>
        <p style={{ fontSize: 15.5, color: '#71717a', maxWidth: 480, margin: '0 auto', lineHeight: 1.75 }}>
          Pick a topic. Watch two AI agents argue opposite sides — one turn at a time — then read a nonpartisan report on where they agree and what really divides them.
        </p>
      </div>

      {/* ── Presets ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28, animation: 'slideUp 0.7s ease 0.1s both' }}>
        {PRESETS.map(p => <PresetChip key={p.label} preset={p} onClick={() => onPreset(p)} />)}
      </div>

      {/* ── Position inputs ── */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14, animation: 'slideUp 0.7s ease 0.15s both' }}>
        <PositionInput label="Debater A argues" emoji="🔴" accent="#ef4444" accentRgb="239,68,68" value={posA} onChange={setPosA} placeholder="e.g. We need stricter gun control laws to prevent mass shootings" />
        <PositionInput label="Debater B argues" emoji="🔵" accent="#3b82f6" accentRgb="59,130,246" value={posB} onChange={setPosB} placeholder="e.g. The Second Amendment is an absolute right" />
      </div>

      {/* ── API Key ── */}
      <div style={{ width: '100%', marginBottom: 14, animation: 'slideUp 0.7s ease 0.2s both' }}>
        <div className="glass-card" style={{ borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase', marginBottom: 6 }}>Anthropic API Key</div>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && onStart()}
            placeholder="sk-ant-..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#d4d4d8', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
      </div>

      {error && <div style={{ width: '100%', marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12 }}>{error}</div>}

      <button onClick={onStart}
        style={{ padding: '13px 38px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 40px rgba(99,102,241,0.3)', animation: 'slideUp 0.7s ease 0.25s both', letterSpacing: '-0.2px', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(99,102,241,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.3)'; }}
      >
        🎙️ Start the Debate
      </button>

      <p style={{ marginTop: 10, fontSize: 10, color: '#27272a', animation: 'fadeIn 1s ease 0.5s both' }}>Your key is never stored — requests go directly to Anthropic.</p>

      {/* How it works */}
      <HowItWorks />
    </main>
  );
}

function HowItWorks() {
  const steps = [
    { icon: '1', label: 'Opening Statements', desc: 'Each debater makes their strongest case — you read A, then B.' },
    { icon: '2', label: 'Rebuttals',           desc: 'Each side directly responds to the other — argument by argument.' },
    { icon: '⚖️', label: "Moderator's Report",  desc: 'A neutral AI analyzes both sides, finds shared values, and names the real disagreement.' },
  ];
  return (
    <div style={{ width: '100%', marginTop: 44, animation: 'fadeIn 1s ease 0.6s both', opacity: 0 }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#27272a', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>How it works</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {steps.map((step, i) => (
          <div key={i} className="glass-card" style={{ borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{step.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d8' }}>{step.label}</div>
            <div style={{ fontSize: 11.5, color: '#52525b', lineHeight: 1.6 }}>{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function RoundDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px', animation: 'fadeIn 0.5s ease both' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#3f3f46', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function PresetChip({ preset, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, border: `1px solid ${hov ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: hov ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', color: hov ? '#a78bfa' : '#71717a', cursor: 'pointer', transition: 'all 0.15s' }}>
      <span>{preset.icon}</span>{preset.label}
    </button>
  );
}

function PositionInput({ label, emoji, accent, accentRgb, value, onChange, placeholder }) {
  return (
    <div className="glass-card" style={{ borderRadius: 12, padding: 16, border: `1px solid rgba(${accentRgb},0.18)`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{emoji}</span>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', color: accent }}>{label}</span>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e4e4e7', fontSize: 13, lineHeight: 1.7, resize: 'none', fontFamily: 'Inter, sans-serif', width: '100%' }} />
    </div>
  );
}

function ShareButton({ posA, posB }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(`🎙️ AI Debate Result\n\n🔴 "${posA}"\n🔵 "${posB}"\n\nAnalyzed with Common Ground`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={handle} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.25)'}`, background: copied ? 'rgba(34,197,94,0.07)' : 'rgba(139,92,246,0.07)', color: copied ? '#4ade80' : '#a78bfa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
      {copied ? '✓ Copied' : '↗ Share this debate'}
    </button>
  );
}
