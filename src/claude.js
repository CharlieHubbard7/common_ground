const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function getSystem(agentType) {
  if (agentType === 'A' || agentType === 'B') {
    return `You are a passionate, strategic political debater. You believe deeply in your position.

First, reason through your argument in <thinking> tags — consider your strongest angles, what emotional and logical appeals are available, what your opponent is likely to say, which framing will be most persuasive. Think through at least 2-3 different approaches before committing to one.

Then outside the tags, deliver your argument in exactly 3-4 clear, direct sentences. Be specific — name real concerns, real stakes, real consequences. Do not hedge. Do not say "both sides." You are here to win on the merits.`;
  }

  // Moderator — comprehensive structured report
  return `You are a thoughtful, nonpartisan political analyst who has just moderated a two-round debate. Your job is to help readers genuinely understand both sides — not to pick a winner, but to illuminate the human values, fears, and reasoning on each side.

First, think carefully in <thinking> tags — assess argument quality, find underlying shared values the debaters may not have recognized, identify the genuine crux of disagreement, consider what someone would need to believe differently to switch sides.

Then write a comprehensive, readable analysis report. Use these exact section headers with ## at the start of each line:

## Overview
[2-3 sentences: what was debated, what was the central tension, what made this debate interesting]

## The Strongest Case For [restate Position A in 4-5 words]
[3-4 sentences: steelman the most compelling version of this position — include what human values and fears motivate it, what would be lost if they're wrong]

## The Strongest Case For [restate Position B in 4-5 words]
[3-4 sentences: steelman the most compelling version of this position — include what human values and fears motivate it, what would be lost if they're wrong]

## Where They Actually Agree
[1-2 sentence introduction about why shared values matter despite surface disagreement. Then bullet points using • for 3-4 core human values both sides genuinely share — not superficial overlap, but deep motivations]

## The Real Point of Disagreement
[2-3 sentences: the genuine philosophical or empirical crux — the specific belief, priority, or assumption where they fundamentally diverge. What would a person need to update to switch sides?]

## Why This Debate Matters
[2-3 sentences: the broader significance of this tension for a democratic society and for how people find meaning and live together]`;
}

function getMessage({ agentType, round, positionA, positionB, ctx = {} }) {
  if (agentType === 'A' && round === 'opening')
    return `You are arguing FOR: "${positionA}"\n\nGive your opening statement — your single most powerful argument.`;

  if (agentType === 'B' && round === 'opening')
    return `You are arguing FOR: "${positionB}"\n\nGive your opening statement — your single most powerful argument.`;

  if (agentType === 'A' && round === 'rebuttal')
    return `You are arguing FOR: "${positionA}"\n\nYour opponent just said:\n"${ctx.openingB}"\n\nDeliver your rebuttal: identify the weakest point in their argument and expose it, then reinforce your own strongest case.`;

  if (agentType === 'B' && round === 'rebuttal')
    return `You are arguing FOR: "${positionB}"\n\nYour opponent just said:\n"${ctx.openingA}"\n\nDeliver your rebuttal: identify the weakest point in their argument and expose it, then reinforce your own strongest case.`;

  // moderator
  return `Debate topic: "${positionA}" vs "${positionB}"

Full transcript:
[OPENING] Debater A: "${ctx.openingA}"
[OPENING] Debater B: "${ctx.openingB}"
[REBUTTAL] Debater A: "${ctx.rebuttalA}"
[REBUTTAL] Debater B: "${ctx.rebuttalB}"

Write your full analysis report.`;
}

export async function streamDebateAgent({
  agentType, round,
  positionA, positionB,
  ctx = {},
  apiKey,
  onThinkingChunk,
  onConclusionChunk,
  onDone,
  onError,
}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: agentType === 'mod' ? 2000 : 1024,
        stream: true,
        system: getSystem(agentType),
        messages: [{ role: 'user', content: getMessage({ agentType, round, positionA, positionB, ctx }) }],
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let accumulated = '';
    let state = 'pre';
    let tagBuf = '';
    const OPEN = '<thinking>', CLOSE = '</thinking>';

    const processText = (text) => {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (state === 'pre') {
          tagBuf += ch;
          if (OPEN.startsWith(tagBuf)) { if (tagBuf === OPEN) { state = 'thinking'; tagBuf = ''; } }
          else tagBuf = '';
        } else if (state === 'thinking') {
          tagBuf += ch;
          if (CLOSE.startsWith(tagBuf)) { if (tagBuf === CLOSE) { state = 'post'; tagBuf = ''; } }
          else {
            const emit = tagBuf.slice(0, -1);
            if (emit) onThinkingChunk(emit);
            tagBuf = '';
            if (CLOSE.startsWith(ch)) tagBuf = ch; else onThinkingChunk(ch);
          }
        } else {
          const rest = text.slice(i);
          if (rest) onConclusionChunk(rest);
          break;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        let parsed; try { parsed = JSON.parse(data); } catch { continue; }
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          const chunk = parsed.delta.text;
          accumulated += chunk;
          processText(chunk);
        }
      }
    }

    const closeIdx = accumulated.indexOf(CLOSE);
    const conclusion = closeIdx !== -1 ? accumulated.slice(closeIdx + CLOSE.length).trim() : accumulated.trim();
    onDone(conclusion);
  } catch (err) {
    onError(err.message || 'Unknown error');
  }
}

export function detectArgumentType(text) {
  const t = text.toLowerCase();
  if (/freedom|liberty|rights|constitutional|amendment|individual|autonomy/.test(t)) return { icon: '⚖️', label: 'Rights & Liberty', color: '#a78bfa' };
  if (/safety|protect|children|violence|death|harm|danger|victims/.test(t))           return { icon: '🛡️', label: 'Public Safety',    color: '#34d399' };
  if (/data|study|evidence|research|statistics|percent|rate|numbers/.test(t))         return { icon: '📊', label: 'Data & Evidence',  color: '#60a5fa' };
  if (/history|tradition|founding|always|never|decades|generations/.test(t))          return { icon: '📜', label: 'Historical',       color: '#fbbf24' };
  if (/economy|jobs|cost|money|burden|economic|financial|afford/.test(t))             return { icon: '💰', label: 'Economic',         color: '#f97316' };
  if (/moral|values|wrong|right|ethical|principle|god|faith/.test(t))                 return { icon: '🏛️', label: 'Moral',            color: '#f472b6' };
  return { icon: '💬', label: 'Logical', color: '#a1a1aa' };
}

export function detectClash(textA, textB) {
  const TOPICS = {
    'Safety': ['safety', 'safe', 'protect', 'harm', 'danger', 'victims'],
    'Rights': ['rights', 'freedom', 'liberty', 'constitutional'],
    'Children': ['children', 'kids', 'families', 'youth'],
    'Government': ['government', 'regulation', 'law', 'federal'],
    'Economy': ['economy', 'jobs', 'cost', 'money'],
    'Violence': ['violence', 'crime', 'death', 'shooting'],
  };
  const a = textA.toLowerCase(), b = textB.toLowerCase();
  return Object.entries(TOPICS)
    .filter(([, words]) => words.some(w => a.includes(w)) && words.some(w => b.includes(w)))
    .map(([topic]) => topic);
}

export function parseSharedValues(text) {
  return text.split('\n').filter(l => l.trim().startsWith('•')).map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean).slice(0, 4);
}

// Parse ## section headers from moderator report
export function parseReportSections(text) {
  const sections = [];
  const parts = text.split(/(?=^## )/m);
  for (const part of parts) {
    const lines = part.split('\n');
    const header = lines[0].replace(/^## /, '').trim();
    const body = lines.slice(1).join('\n').trim();
    if (header && body) sections.push({ header, body });
    else if (!header && body) sections.push({ header: '', body }); // preamble
  }
  return sections;
}
