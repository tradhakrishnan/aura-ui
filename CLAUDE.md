# AURA — Autonomous Unified Resolution Agent

**Hackathon:** Marriott Codefest 4.0 — "Bring Your Own Theme"
**Theme:** Multi-agent AI for fully automated production support
**Status:** POC / MVP — fully deployed on AWS

---

## 1. Project Overview

AURA is a multi-agent AI framework that handles production support tasks for the TAP system.
Specialized LLM-powered agents — service desk analysts, domain experts, system experts —
collaborate dynamically to diagnose, escalate, resolve, validate, and auto-close production
incidents end-to-end without manual triage.

### Key Value Proposition
- Reduces Mean Time to Resolution (MTTR) from ~47 min → ~4 min
- Eliminates manual first-line triage (est. 60-70% engineering effort saved)
- Fully closed loop: ticket in → agents diagnose → human approves → fix executes → validation confirms → ticket auto-closes

---

## 2. Tech Stack

### UI (`aura-ui/`)
| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Plain CSS (no Tailwind) |
| Port | **3000** |
| Entry point | `src/main.tsx` → `src/App.tsx` |

### Backend (`aura-agent-service/`)
| Layer | Choice |
|---|---|
| Framework | FastAPI + Python 3.11 |
| Agent orchestration | LangGraph StateGraph |
| LLM | Claude claude-sonnet-4-6 via Anthropic SDK |
| Database | MongoDB `aura_db` on `localhost:27017` |
| Port | **8090** |
| Entry point | `main.py` |

> **Port rule:** UI on 3000, Backend on 8090. Vite proxies `/agent/*` → `http://localhost:8090`.

---

## 3. Repository Structure

```
marriott-aura/
├── aura-ui/                           ← React frontend
│   ├── CLAUDE.md                      ← this file
│   ├── vite.config.ts                 ← port 3000, /agent proxy to 8090
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    ← 7-page SPA, nav orchestration
│       ├── App.css                    ← dark theme, header, nav, animations
│       ├── index.css
│       ├── api/
│       │   └── agentApi.ts            ← all API calls (fetch wrappers + types)
│       └── components/
│           ├── TapEcosystem.tsx/css   ← TAP hub-spoke diagram
│           ├── FrameworkDiagram.tsx/css ← AURA pipeline diagram
│           ├── TechArchitecture.tsx/css ← technical architecture view
│           ├── AgentRun.tsx/css       ← full-screen run viewer (streaming SSE)
│           ├── TicketStatus.tsx/css   ← run history / status dashboard
│           └── JiraIssues.tsx/css     ← Jira issues list + manual trigger
│
└── aura-agent-service/                ← FastAPI backend
    ├── main.py                        ← all API routes
    ├── config.py                      ← env var loading
    ├── requirements.txt
    ├── models/
    │   └── ticket.py                  ← Ticket pydantic model
    ├── agents/
    │   ├── base.py                    ← shared LLM invocation + retry
    │   ├── state.py                   ← AuraState TypedDict
    │   ├── graph.py                   ← LangGraph StateGraph wiring
    │   ├── sda.py                     ← Service Desk Analyst (open + close)
    │   ├── spa.py                     ← Software Programmer Agent
    │   ├── sme.py                     ← Subject Matter Expert
    │   ├── rat.py                     ← Risk Assessment Team
    │   ├── authorizer.py              ← Human-in-loop authorizer node
    │   └── ea.py                      ← Execution Agent + Validation Agent
    └── integrations/
        └── jira_client.py             ← Jira Cloud REST integration
```

---

## 4. Multi-Page Navigation (App.tsx)

The app uses React state (no React Router) to switch between 7 pages.

```typescript
type Page = 'home' | 'ecosystem' | 'framework' | 'architecture' | 'team' | 'jira' | 'status' | 'run'
```

### Page Layout Rules

- **App-shell pages** (persistent nav always visible): `home`, `ecosystem`, `framework`, `architecture`, `team`, `jira`
- **Full-screen pages** (own header, no app shell): `status` (TicketStatus), `run` (AgentRun)

```typescript
const NAV_ITEMS = [
  { page: 'ecosystem',    label: 'TAP Ecosystem' },
  { page: 'framework',    label: 'AURA Framework' },
  { page: 'architecture', label: 'Tech Architecture' },
  { page: 'team',         label: 'Team' },
  { page: 'jira',         label: 'Jira Issues',   cls: 'nav-jira-btn'   },
  { page: 'status',       label: 'Ticket Status', cls: 'nav-status-btn' },
  { page: 'run',          label: '▶ Run Agent',   cls: 'nav-run-btn'    },
]
```

The AURA logo badge is a clickable button that navigates to the home page.

---

## 5. Agent Pipeline — 8-Node LangGraph StateGraph

```
sda_open → spa → sme → rat → [HUMAN APPROVAL GATE] → ea → va → sda_close
```

| # | Node | Agent | Role |
|---|---|---|---|
| 1 | `sda_open` | Service Desk Analyst | Parses ticket, extracts key facts, frames the problem |
| 2 | `spa` | Software Programmer Agent | Analyses code/config root causes |
| 3 | `sme` | Subject Matter Expert | Domain expertise, known patterns, Confluence runbooks |
| 4 | `rat` | Risk Assessment Team | Classifies risk level: Low / Medium / High / Critical |
| 5 | `authorizer` | Human-in-loop | Pause node — emits `status: pending_approval` to UI |
| 6 | `ea` | Execution Agent | Applies the fix (test/non-prod microservice stubs) |
| 7 | `va` | Validation Agent | Runs 3 health checks to confirm fix worked |
| 8 | `sda_close` | Service Desk Analyst | Writes resolution summary, closes ticket |

### Human Approval Gate

After `rat` completes, the pipeline pauses and sets `status: pending_approval` in MongoDB.
The UI shows an **Approve / Reject** button. The operator must approve before `ea` runs.

- **Approve:** `POST /agent/run/{run_id}/approve` → continues pipeline
- **Reject:** `POST /agent/run/{run_id}/reject` → sets `status: rejected`, pipeline stops

---

## 6. Backend API Endpoints (main.py)

### Run Management
| Method | Path | Description |
|---|---|---|
| `POST` | `/agent/run` | Submit a new ticket, start agent pipeline |
| `GET` | `/agent/run/{run_id}` | Get run state (status, agent outputs, ticket) |
| `GET` | `/agent/runs` | List all runs (summary — no full agent text) |
| `POST` | `/agent/run/{run_id}/approve` | Approve pending run → continue pipeline |
| `POST` | `/agent/run/{run_id}/reject` | Reject pending run → stop pipeline |
| `POST` | `/agent/run/{run_id}/retry` | Retry a failed run (creates new run from same ticket) |
| `GET` | `/agent/run/{run_id}/stream` | SSE stream of real-time agent events |

### Jira Integration
| Method | Path | Description |
|---|---|---|
| `GET` | `/agent/jira/issues` | Fetch all Jira issues, annotated with aura_run_id if processed |
| `POST` | `/agent/webhook/jira` | Jira webhook receiver — **acknowledge-only, no auto-run** |

### Ticket Submit Payload
```typescript
interface TicketPayload {
  ticket_id:      string
  source:         string          // 'Jira' | 'Manual'
  title:          string          // max 200 chars
  description:    string          // max 500 chars (truncated before agent)
  severity:       string          // 'Critical' | 'High' | 'Medium' | 'Low'
  reported_by:    string
  jira_issue_key?: string         // set when originating from Jira Issues page
}
```

---

## 7. MongoDB Persistence

**Database:** `aura_db` · **Collection:** `agent_runs`

Runs are persisted to MongoDB on create and updated after each agent node and approval action.

```python
# Run document shape
{
  "run_id":        str,           # UUID
  "ticket_id":     str,
  "status":        str,           # 'running' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'failed'
  "ticket":        dict,          # full TicketPayload
  "agents":        list[dict],    # [{node, summary, timestamp}]
  "created_at":    datetime,
  "updated_at":    datetime,
  "jira_issue_key": str | None,
  "jira_browse_url": str | None,
  "rejected":      bool,
}
```

---

## 8. Jira Cloud Integration

### Environment Variables (.env in aura-agent-service/)
```env
JIRA_URL=https://<org>.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=<Atlassian API token>
JIRA_PROJECT_KEY=AURA
```

**Getting an API token:** Atlassian → Profile → Security → API Tokens → Create and copy.

**Finding project key:** Open your Jira board URL — the key appears in the URL path (e.g., `/projects/AURA/boards/1` → key is `AURA`).

### jira_client.py — Public Functions

| Function | Description |
|---|---|
| `is_configured()` | Returns True if all 4 env vars are set |
| `get_project_issues(project_key, max_results=50)` | Fetch all issues (all statuses), newest first |
| `get_issue(issue_key)` | Fetch single issue as plain-text dict |
| `add_comment(issue_key, body)` | Add a comment to an issue |
| `transition_in_progress(issue_key)` | Move issue to In Progress |
| `transition_done(issue_key)` | Move issue to Done/Resolved |
| `comment_picked_up(issue_key)` | Comment when AURA starts processing |
| `comment_agent_done(issue_key, node_name, summary)` | Progress comment after each agent |
| `comment_awaiting_approval(issue_key, risk_level)` | Comment when waiting for human |
| `comment_approved(issue_key)` | Comment when operator approves |
| `comment_rejected(issue_key)` | Comment when operator rejects |
| `comment_resolved(issue_key, resolution)` | Final resolution comment |

All functions are fire-and-forget — exceptions are swallowed so a Jira outage never blocks the agent pipeline.

### Webhook Behavior

The webhook endpoint (`POST /agent/webhook/jira`) is **acknowledge-only**. It logs the event but does NOT auto-trigger any agent run. Issue execution is entirely manual — a human must open the Jira Issues page and click **▶ Run AURA**.

---

## 9. JiraIssues Component

Displays all issues from the configured Jira project. Rendered inside the app shell (persistent nav visible).

### Features
- Filter tabs: All / Open / In Progress / Closed (with issue counts)
- Table columns: Issue key (link to Jira), Summary, Priority badge, Status badge (In Progress pulses), Type, Reporter, Created date, Action
- **▶ Run AURA** button for open/in-progress issues → submits ticket and navigates to AgentRun
- **View Run →** button if AURA has already processed that issue (`aura_run_id` present)
- **✓ Closed** label for done issues (no Run button)
- Refresh button + last-refreshed timestamp
- Warning state when Jira is not configured

### Priority → Severity mapping (for AURA ticket submission)
```typescript
const SEVERITY_MAP = {
  Highest: 'Critical', Critical: 'Critical',
  High: 'High', Medium: 'Medium',
  Low: 'Low', Lowest: 'Low',
}
```

### Description cap
Description is capped at 500 chars when submitting to prevent prompt token bloat.

---

## 10. AgentRun Component

Full-screen run viewer with real-time SSE streaming. Entered from:
- Nav "▶ Run Agent" button (new manual run)
- JiraIssues "▶ Run AURA" button (Jira-linked run)
- JiraIssues "View Run →" button (existing run)
- TicketStatus "View" button (any historical run)

### Features
- Chip bar: run ID, ticket ID, source, status badge, Jira badge (links to Jira issue when present)
- Approval panel (when `status === 'pending_approval'`): Approve / Reject buttons
- **↻ Retry** button (when `status === 'failed'`) — calls `POST /agent/run/{run_id}/retry`
- Agent output cards: each node rendered with its summary text as it streams in
- Demo preset buttons (quick-fill ticket form for demo scenarios)

### Jira Badge
When a run is linked to a Jira issue (`jira_browse_url` is set), a blue Jira badge with icon appears in the chip bar and links to the Jira issue.

---

## 11. Rate Limit Protection (Claude API)

To handle Claude API 429 errors (token rate limits), `agents/base.py` implements exponential backoff:

```python
def _invoke_with_retry(bound, msgs, max_retries=4):
    delay = 15  # seconds
    for attempt in range(max_retries):
        try:
            return bound.invoke(msgs)
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                if attempt < max_retries - 1:
                    time.sleep(delay + random.uniform(0, 5))
                    delay *= 2   # 15s → 30s → 60s → 120s
                    continue
            raise
```

Additional safeguards:
- Description truncated to 500 chars in `sda_open_node` before building agent context
- Description capped at 500 chars in `JiraIssues.tsx` before calling `submitTicket`
- Jira `get_project_issues` returns descriptions capped at 600 chars

---

## 12. Design System

### Color Palette (dark theme — background `#0d0f1a`)

| Token | Hex | Used for |
|---|---|---|
| Background | `#0d0f1a` | Page background |
| Surface | `rgba(255,255,255,0.02)` | Card/section backgrounds |
| Border | `rgba(255,255,255,0.07)` | Default borders |
| Text primary | `#f1f5f9` | Headings |
| Text secondary | `#94a3b8` | Labels, captions |
| Text muted | `#64748b` | Descriptions, disabled |
| Jira blue | `#2684ff` | Jira badges, Jira Issues nav button |
| Green | `#4ade80` | Done status, closed label, all-pass |
| Red | `#f85149` | Error notices, retry button |
| Amber | `#f59e0b` | Warning notices |
| Purple | `#c084fc` / `#a78bfa` | AURA brand accent |
| Blue | `#60a5fa` | Risk, execution, view-run button |

### Active Nav State
`.nav-link--active` uses a bottom border in the page's accent color and slightly brighter text.

---

## 13. How to Run Locally

### Backend

```bash
cd aura-agent-service

# Create virtualenv (first time)
python3.11 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and populate env vars
cp .env.example .env
# Edit .env: ANTHROPIC_API_KEY, MONGO_URI, JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY

# Start backend
python main.py
# Runs on http://localhost:8090
```

### Frontend

```bash
cd aura-ui
npm install
npm run dev
# Runs on http://localhost:3000
# /agent/* proxied to http://localhost:8090
```

### MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community
# Verify: mongosh --eval "db.adminCommand('ping')"
```

### Kill & restart backend

```bash
lsof -ti :8090 | xargs kill -9 && .venv/bin/python main.py
```

---

## 14. Environment Variables

All in `aura-agent-service/.env`:

```env
# LLM
ANTHROPIC_API_KEY=sk-ant-...

# MongoDB
MONGO_URI=mongodb://localhost:27017

# Jira Cloud (all 4 required for Jira integration)
JIRA_URL=https://<org>.atlassian.net
JIRA_EMAIL=your@email.com
JIRA_API_TOKEN=<api-token>
JIRA_PROJECT_KEY=AURA
```

---

## 15. Demo Flow

### Option A — Manual ticket (no Jira)
1. Click **▶ Run Agent** in nav
2. Use a demo preset button or fill in the form
3. Watch agents stream in real-time
4. Click **Approve** at the human approval gate
5. Agents complete — view resolution summary

### Option B — Jira Issues (recommended for demo)
1. Click **Jira Issues** in nav — issues load from Jira project
2. Find an open issue, click **▶ Run AURA**
3. Navigates to AgentRun automatically
4. Approve at the human gate
5. After completion, Jira issue is automatically:
   - Transitioned to Done
   - Commented with each agent's output
   - Comment added for approval/rejection events

### Option C — View historical runs
1. Click **Ticket Status** in nav
2. Browse all past runs with status badges
3. Click any run to open it in AgentRun viewer

---

## 16. Team

| Name | Role | Stack |
|---|---|---|
| Tamilselvan R | AI & Agent Orchestration | LangGraph · Claude API |
| Prasath K | Backend Services | Spring Boot · Java 21 |
| Divya S | Python Client Adapters | FastAPI · Python 3.11 |
| Arjun M | Frontend & UI/UX | React 19 · TypeScript |

Built in 48 hours for Marriott Codefest 4.0.

---

## 17. Disclaimer

No Marriott production or non-production data, systems, services, microservices, or source code
are used in this product. AURA is an independent Marriott Codefest 4.0 prototype built solely
for demonstration purposes. System behavior may vary based on the chosen backbone language models,
model temperature, issue complexity, data quality, and other non-deterministic factors.
