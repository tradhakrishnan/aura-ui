# AURA UI

React frontend for the AURA multi-agent production support system. Provides ticket submission, live agent run monitoring with tool call visualization, human approval workflow, Jira Issues integration, run history, and system architecture diagrams.

---

## Overview

| Property | Value |
|---|---|
| Service Name | `aura-ui` |
| Port | **3000** |
| Stack | React 19 · TypeScript · Vite 8 |
| Styling | Plain CSS (no Tailwind/UI library) |
| Theme | Dark (`#0d0f1a` background) |
| API Proxy | `/agent/*` → `http://localhost:8090` |

---

## Architecture

```
Browser :3000
    │
    ├── App.tsx (layout + 7-page navigation)
    │   ├── App-shell pages (persistent nav)
    │   │   ├── Home
    │   │   ├── TapEcosystem.tsx      TAP hub-spoke diagram
    │   │   ├── FrameworkDiagram.tsx  AURA agent pipeline diagram
    │   │   ├── TechArchitecture.tsx  Technical architecture view
    │   │   ├── Team
    │   │   └── JiraIssues.tsx        Jira project issues list
    │   └── Full-screen pages (own header, no app shell)
    │       ├── TicketStatus.tsx      Run history dashboard
    │       └── AgentRun.tsx          Ticket form + live agent monitoring
    │
    └── src/api/agentApi.ts
        │  (fetch wrappers)
        ▼
    Vite dev proxy /agent/* → localhost:8090
        ▼
    aura-agent-service :8090
```

---

## File Structure

```
aura-ui/
├── vite.config.ts               proxy /agent → :8090, port 3000
├── package.json
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx                 React root mount
    ├── App.tsx                  7-page SPA, nav + page state
    ├── App.css                  Dark theme, header, nav, hero
    ├── index.css                CSS reset
    ├── api/
    │   └── agentApi.ts          Typed fetch functions for all /agent/* endpoints
    └── components/
        ├── TapEcosystem.tsx/css         TAP hub-spoke ecosystem diagram
        ├── FrameworkDiagram.tsx/css     AURA 8-stage pipeline diagram
        ├── TechArchitecture.tsx/css     Technical architecture view
        ├── AgentRun.tsx/css             Full-screen run viewer
        ├── TicketStatus.tsx/css         Run history dashboard
        └── JiraIssues.tsx/css           Jira project issues list + trigger
```

---

## Navigation

```typescript
type Page = 'home' | 'ecosystem' | 'framework' | 'architecture' | 'team' | 'jira' | 'status' | 'run'
```

| Page | Type | Entry point |
|---|---|---|
| Home | App-shell | Default landing |
| TAP Ecosystem | App-shell | Nav → "TAP Ecosystem" |
| AURA Framework | App-shell | Nav → "AURA Framework" |
| Tech Architecture | App-shell | Nav → "Tech Architecture" |
| Team | App-shell | Nav → "Team" |
| Jira Issues | App-shell | Nav → "Jira Issues" |
| Ticket Status | Full-screen | Nav → "Ticket Status" |
| Agent Run | Full-screen | Nav → "▶ Run Agent" or Jira Issues → "▶ Run AURA" |

---

## Key Features

### Ticket Submission Form

Fields:
- **Ticket ID** — e.g. `AURA-13`
- **Source** — dropdown: `ServiceNow`, `Jira`, `Manual`
- **Title** — short description
- **Description** — detailed problem statement (capped at 500 chars before agent submission)
- **Severity** — dropdown: `Critical`, `High`, `Medium`, `Low`
- **Affected System** — `MARSHA`, `ACRS`, `MINT` (optional — agents discover if blank)
- **Affected Hotel** — hotel code e.g. `PARBA`
- **Affected Location** — location code e.g. `HTDV7N`
- **Affected EID** — employee ID e.g. `WITSF960`
- **Reported By** — reporter EID

On submit: calls `POST /agent/run`, stores `run_id`, starts polling.

---

### Live Agent Monitoring

Polls `GET /agent/run/{run_id}` every 2 seconds while `status === "running"`.

#### Progress Banner

| State | Color | Text |
|---|---|---|
| Running | Blue | AGENTS RUNNING |
| Awaiting approval | Amber | AWAITING YOUR APPROVAL |
| Completed | Green | COMPLETED |
| Failed | Red | FAILED |

#### Agent Pipeline View

Each of the 8 pipeline stages is rendered as a numbered step with two cards:

**AGENT CALL card** (blue header) — shows the input context the agent received:
- For permission tickets: the structured ticket fields (EID, system, permission, action)
- For other tickets: a prose description of what the agent was asked to investigate

**AGENT RESULT card** (green header) — shows the agent's full output rendered as Markdown.

Both cards are collapsible. Clicking the AGENT CALL header toggles the pair. Default state is expanded. A chevron rotates to indicate collapsed/expanded state.

| Step | Agent | Call badge | Result badge |
|---|---|---|---|
| 1 | Service Desk Analyst (Open) | SDA | SDA |
| 2 | Software Programmer Agent | SPA | SPA |
| 3 | Subject Matter Expert | SME | SME |
| 4 | Risk Assessment | RAT | Immediate=red / Normal=gray / Escalated=orange |
| 5 | Authorizer | AUTHORIZER | Amber pending / Green approved |
| 6 | Executing Agent | EA | EA |
| 7 | Validation Agent | VA | Teal VALIDATED / Red FAILED |
| 8 | Service Desk Analyst (Close) | SDA | Green CLOSED |

#### RESOLUTION COMPLETE Card

After `status === "completed"` and the run was not rejected, a final `RESOLUTION COMPLETE` card renders the `sda_summary` closure output from the SDA-close agent.

---

### Human Approval Workflow

When the Authorizer agent completes:
1. `pending_approval = true` is set in run state
2. Banner changes to amber "AWAITING YOUR APPROVAL"
3. Authorizer step expands automatically showing the RECOMMENDATION
4. **Approve & Execute** (green) and **Reject** (red) buttons appear inside the AGENT RESULT card
5. Clicking Approve calls `POST /agent/run/{id}/approve`
6. Polling resumes — EA, VA, SDA-close steps fill in as they complete

---

### Jira Issues Page

Displays all issues from the configured Jira project.

- Filter tabs: All / Open / In Progress / Closed (with issue counts)
- Table columns: Issue key (links to Jira), Summary, Priority, Status, Reporter, Created, Action
- **▶ Run AURA** — submits the issue as a ticket and navigates to AgentRun
- **View Run →** — opens an existing run for that issue (when `aura_run_id` is set)
- **✓ Closed** — label for resolved issues
- Refresh button + last-refreshed timestamp

Priority → Severity mapping:
```typescript
{ Highest: 'Critical', Critical: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low', Lowest: 'Low' }
```

---

### Ticket Status Page

Full-screen run history dashboard:
- Lists all past runs with status badge, ticket ID, source, started/completed timestamps
- Click any run to open it in the AgentRun viewer

---

## API Layer (`src/api/agentApi.ts`)

```typescript
submitTicket(ticket: TicketPayload): Promise<{ run_id: string }>
getRun(runId: string): Promise<RunData>
listRuns(): Promise<RunSummary[]>
approveRun(runId: string): Promise<void>
rejectRun(runId: string): Promise<void>
getJiraIssues(): Promise<JiraIssue[]>
```

### TicketPayload
```typescript
interface TicketPayload {
  ticket_id:        string
  source:           string    // "ServiceNow" | "Jira" | "Manual"
  title:            string
  description:      string
  severity:         string    // "Critical" | "High" | "Medium" | "Low"
  affected_system?: string
  affected_hotel?:  string
  affected_location?: string
  affected_eid?:    string
  reported_by?:     string
  jira_issue_key?:  string
}
```

### RunData
```typescript
interface RunData {
  run_id:            string
  status:            'running' | 'completed' | 'failed'
  ticket_id:         string
  ticket?:           TicketPayload
  started_at?:       string
  completed_at?:     string
  agents_completed:  string[]
  agent_conversation: AgentMessage[]
  ticket_status:     string              // "Open" | "In Progress" | "Resolved" | "Closed"
  ticket_type?:      string              // "permission" | "hotel_location" | "user_access" | "generic"
  resolution_context?: object            // {eid, permission, system, action} for permission tickets
  sda_summary:       string
  spa_findings:      string
  sme_verdict:       string
  risk_level:        string              // "Immediate" | "Normal" | "Escalated"
  authorized:        boolean
  pending_approval:  boolean
  execution_log:     { agent: string; report: string }[]
  validation_report: { status: string; details: string }
  rejected?:         boolean
  jira_browse_url?:  string
  error?:            string
}
```

---

## Vite Proxy Configuration

```typescript
// vite.config.ts
proxy: {
  '/agent': { target: 'http://localhost:8090', changeOrigin: true },
}
```

---

## Setup & Run

### Prerequisites
- Node.js 20+
- `aura-agent-service` running on port 8090

### Install dependencies
```bash
cd aura-ui
npm install
```

### Run development server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Build for production
```bash
npm run build
# Output in dist/
```

### Type check
```bash
npx tsc --noEmit
```

---

## Design System

### Color Palette

| Token | Hex | Used for |
|---|---|---|
| Background | `#0d0f1a` | Page background |
| Surface | `rgba(255,255,255,0.02)` | Card backgrounds |
| Border | `rgba(255,255,255,0.07)` | Default borders |
| Text primary | `#f1f5f9` | Headings |
| Text secondary | `#94a3b8` | Labels |
| Text muted | `#64748b` | Descriptions, disabled |
| Blue | `#60a5fa` | AGENT CALL cards, running state |
| Green | `#4ade80` | AGENT RESULT cards, completed, validated |
| Amber | `#f59e0b` | Pending approval, data sources |
| Teal | `#2dd4bf` | Validation agent |
| Red | `#f87171` | Failed, validation failed, reject |
| Orange | `#fb923c` | Escalated risk |
| Purple | `#c084fc` / `#a78bfa` | AURA brand accent |
| Jira blue | `#2684ff` | Jira badges and nav button |

### Agent Step Status Indicators

```
⏳ PENDING       — gray, not yet started
⚡ RUNNING       — blue pulse animation
✓ DONE          — green (most agents)
RISK: Normal    — gray background
RISK: Immediate — red background
RISK: Escalated — orange background
⏳ Awaiting Approval — amber (Authorizer pending)
✓ Approved by Human  — green (Authorizer approved)
✓ VALIDATED         — teal (VA pass)
✗ VALIDATION FAILED — red (VA fail)
✔ CLOSED            — green (SDA-close done)
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| Port 3000 already in use | Another process | `kill -9 $(lsof -ti :3000)` |
| 422 on ticket submit | Invalid `severity` or `source` enum | Use `Critical/High/Medium/Low` and `ServiceNow/Jira/Manual` |
| "Submitting..." hangs | Agent service not running | Ensure agent service is on port 8090 |
| Agents stuck in PENDING | Agent service crashed | Check agent service logs; restart |
| Approve button missing | `pending_approval` not `true` | Verify Authorizer agent ran successfully |
| Jira Issues page empty | Jira env vars not set | Set `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` in agent service `.env` |

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Initial load | < 2s (Vite dev server) |
| Polling interval | 2s while `status === "running"` |
| Polling stops | On `status === "completed"` or `"failed"` |
| Agent output | Rendered as Markdown (react-markdown + remark-gfm) |
| CORS | Handled by Vite proxy — no CORS headers needed on agent service |
| Browser support | Chrome / Safari / Firefox (modern versions) |

---

## Dependencies

| Service | Direction | Purpose |
|---|---|---|
| `aura-agent-service` :8090 | Downstream | All agent API calls proxied here |
