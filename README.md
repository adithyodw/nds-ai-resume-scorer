# NDS TalentScore — AI Résumé Scoring Platform

Enterprise AI résumé scoring for **NetData** System Integrator (SI) hiring. HR uploads CVs (single or bulk), the engine scores candidates against international network/security/cloud standards, and recommends whether to forward them to hiring managers.

Built with **zero paid API cost** for core functionality — a deterministic rule-based SI scoring engine with optional LLM narrative refinement when API keys are configured.

## Features

- **Résumé upload** — PDF, DOCX, ZIP (bulk), drag & drop
- **AI scoring** — Technical, certification, experience, communication, résumé quality
- **HR decision engine** — Strong Hire / Hire / Consider / Weak Fit / Reject
- **Candidate database** — Filters, ranking, shortlist/reject actions
- **Comparison matrix** — Side-by-side radar charts for hiring managers
- **Analytics dashboard** — Funnel, certification heatmap, role demand

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API routes (simple, no separate server)
- **Storage:** JSON file (`.data/candidates.json`) — swap `lib/store.ts` for Postgres later
- **Parsing:** `unpdf` (PDF), `mammoth` (DOCX), `jszip` (ZIP)
- **AI:** Rule-based engine (`lib/scoring/`) — optional OpenAI/Anthropic for narrative only

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional LLM refinement

Set one of these in `.env.local` (scores stay rule-based; only summaries are refined):

```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/candidates` | List all candidates |
| `GET` | `/api/candidates/[id]` | Get one candidate |
| `PATCH` | `/api/candidates/[id]` | Update status (`new`, `review`, `shortlisted`, `rejected`) |
| `DELETE` | `/api/candidates/[id]` | Remove candidate |
| `POST` | `/api/upload` | Upload PDF/DOCX/ZIP — multipart field `files` |

## Scoring Domains

The engine understands SI hiring standards for:

- **Network engineering** — CCNA/CCNP/CCIE, BGP, OSPF, MPLS, SD-WAN, Cisco/Juniper/Fortinet
- **Security** — SOC, SIEM, Palo Alto, Fortinet, incident response
- **Cloud / infrastructure** — AWS, Azure, GCP, Kubernetes, VMware

## Project Structure

```
app/                  # Next.js pages & API routes
components/           # UI (ported from design-reference)
lib/
  scoring/            # Extract → score → optional LLM refine
  parse/              # PDF/DOCX/ZIP parsing
  store.ts            # Candidate persistence
  rubrics.ts          # SI domain taxonomy & weights
design-reference/     # Original Claude Code UI prototype (reference only)
```

## Deploy

Works on Vercel. For persistent storage on serverless, replace `lib/store.ts` with a database (Neon Postgres, Supabase, etc.) or use Vercel Blob for the JSON file.

```bash
npm run build
npm start
```

## License

Proprietary — NetData internal HR platform.
