🤖 Common Ground — Claude Hackathon Submission
Built at the Claude Builder Hackathon · April 2026

📌 What We Built
Common Ground is an AI-powered civic dialogue tool that turns any political disagreement into a structured, readable debate — two Claude agents argue opposite sides turn by turn, then a third acts as a nonpartisan moderator who finds the shared human values beneath the surface conflict.

Live Demo: [link]
Video Walkthrough: [link]
Claude Integration Doc: [🔗 View Google Doc](https://docs.google.com/document/d/1FS82zqEbO0KZZJM_ojo8Ighfollr4Pnb93XpZVPYylo/edit?tab=t.0)

⚡ Features
Turn-by-turn AI debate — Debater A argues, you read, click Continue, Debater B responds. Two full rounds (opening statements + rebuttals) paced so you can actually absorb each argument
Live audience reaction meter — A real-time bar that drifts toward whichever agent is currently speaking, giving the debate a live-TV feel
Reasoning transparency — Every agent's raw <thinking> stream is captured and shown in a collapsible monospace feed, so you can read how the AI formed its argument, not just what it said
Clash detection — Automatically flags when both debaters invoke the same terrain (safety, rights, economy, etc.) mid-debate
Moderator's Report — A structured six-section analysis: overview, steelmanned case for each side, shared values, the genuine point of disagreement, and why it matters for democracy
Topic presets — Gun control, immigration, healthcare, climate, education — one click to populate both sides
🛠️ Tech Stack
Layer	Technology
Frontend	React + Vite
Styling	Tailwind CSS + inline styles
AI	Claude API (claude-sonnet-4-20250514)
Backend	None — Anthropic API called directly from browser
Deployment	Vercel
🤖 How We Used Claude
Claude was deeply integrated into both our development workflow and the product itself.

In Development

Ideation — Used Claude.ai to brainstorm the civic dialogue concept and its connection to Machines of Loving Grace
Prompt Engineering — Prompted Claude to generate optimized Claude Code master prompts
Claude Code — Shipped the entire codebase via Claude Code using those master prompts
In the Product

The Claude API powers three parallel agents with distinct roles:

Debater A & B — Given the same system prompt but opposite positions, each agent uses chain-of-thought reasoning (<thinking> tags) to explore multiple argument frames before delivering a 3–4 sentence argument. Rebuttal rounds pass the opponent's prior output as context so agents genuinely respond to each other.
Moderator — A third agent receives the full four-turn transcript and produces a structured six-section report using role prompting ("nonpartisan political analyst") and explicit ## section headers for clean parsing.
Model used: claude-sonnet-4-20250514

Creative prompting techniques:

Extended chain-of-thought via explicit <thinking> tags, streamed live to the UI
Role prompting (passionate debater vs. nonpartisan analyst)
Structured output with ## section headers parsed client-side into formatted report sections
Multi-agent context passing — each agent's concluded output is injected into the next agent's user message
📸 Full breakdown with screenshots: [View Claude Integration Doc →]

🚀 Getting Started

# Clone the repo
git clone https://github.com/YOUR_USERNAME/common-ground.git
cd common-ground

# Install dependencies
npm install

# Run locally (API key entered in the UI at runtime — no .env needed)
npm run dev
Your Anthropic API key is entered directly in the app's UI and never stored. All requests go to the Anthropic API from your browser.

👥 Team
Name	Role
Charlie Hubbard,	Product / Frontend / Prompting
📄 License
MIT
