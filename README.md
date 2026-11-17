# Common Ground

Built for the Claude Builder Hackathon, April 2026.

Type in two opposing positions on a political question. Two Claude agents debate them over two rounds (an opening statement and a rebuttal each). A third agent then writes a moderator's report: the strongest case for each side, the values both sides share, and where they actually disagree.

[Live demo](https://commonground-blue.vercel.app/) · [Video walkthrough](https://drive.google.com/file/d/1IsG_Ywn7i_YYj95Qau-pBt1Z7l95pMaB/view?usp=sharing) · [Write-up on the Claude integration](https://docs.google.com/document/d/1FS82zqEbO0KZZJM_ojo8Ighfollr4Pnb93XpZVPYylo/edit?tab=t.0)

## How it works

The debate runs one turn at a time:

1. Debater A's opening, then Debater B's opening.
2. Debater A's rebuttal to B's opening, then B's rebuttal to A's opening.
3. The moderator reads all four turns and writes the report.

The two debaters share a system prompt and are given opposite positions. Each reasons in `<thinking>` tags before answering in 3–4 sentences. Responses stream from the Messages API, and the reasoning is shown in a collapsible panel next to each argument, so you can see how the argument was built.

The moderator's report always has the same six sections:
- overview;
- the strongest case for A;
- the strongest case for B;
- where they agree;
- the real point of disagreement;
- why it matters.

The UI parses the report into separate panels by its `##` headings.

Smaller pieces:
- **Topic presets:** gun control, immigration, healthcare, climate and education.
- **Shared-ground tags:** a simple keyword check that highlights when both rebuttals touch the same theme (safety, rights, the economy, and so on).

## Stack

- React and Vite, deployed on Vercel.
- Claude (`claude-sonnet-4-20250514`), called straight from the browser. There's no backend: each user pastes their own Anthropic API key, which stays in memory and isn't stored.

```bash
npm install
npm run dev
```

Built by Charlie Hubbard, using Claude Code.
