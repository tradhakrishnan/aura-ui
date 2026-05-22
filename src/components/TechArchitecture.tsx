import './TechArchitecture.css'

/* ── GitHub link badge ─────────────────────────────────────── */
const GhLink = ({ repo }: { repo: string }) => (
  <a
    href={`https://github.com/tradhakrishnan/${repo}`}
    target="_blank"
    rel="noopener noreferrer"
    className="ta-gh-link"
    onClick={e => e.stopPropagation()}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
    {repo}
  </a>
)

/* ── Shared primitives ─────────────────────────────────────── */

const VConn = ({ color = '#334155' }: { color?: string }) => (
  <div className="ta-vconn">
    <svg width="2" height="12" viewBox="0 0 2 12">
      <line x1="1" y1="0" x2="1" y2="12" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" />
    </svg>
  </div>
)

/* ── Merge connector (two sources → one agent service) ────── */
const MergeConn = () => (
  <div className="ta-merge-conn">
    <div className="ta-merge-leg ta-merge-leg--left" />
    <div className="ta-merge-leg ta-merge-leg--right" />
    <div className="ta-merge-bar" />
    <div className="ta-merge-trunk" />
  </div>
)

/* ── Layer 1 — Input ──────────────────────────────────────── */
const InputLayer = () => (
  <div className="ta-layer">
    <div className="ta-layer-eyebrow" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
      Input Layer
    </div>
    <div className="ta-full-row">

      {/* Jira Cloud — external issue source */}
      <div className="ta-card ta-card--jira ta-card--flex">
        <div className="ta-card-header-row">
          <div className="ta-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2684ff">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 18.298 18.3V6.762a1.005 1.005 0 0 0-1.004-1.005zm5.701-5.757H11.48a5.215 5.215 0 0 0 5.215 5.215h2.13v2.04A5.215 5.215 0 0 0 24 12.47V1.005A1.005 1.005 0 0 0 22.995 0z" />
            </svg>
          </div>
          <div className="ta-card-name">Jira Cloud</div>
          <div className="ta-card-sub">atlassian.net · REST API v3</div>
        </div>
        <div className="ta-card-note">
          Human opens <strong>Jira Issues page</strong> → UI calls Agent Service<br />
          Agent Service fetches issues from Jira via <code>jira_client.py</code>
        </div>
        <div className="ta-card-chips">
          <span className="ta-chip ta-chip--jira">Issue Source</span>
          <span className="ta-chip">Webhook (ack-only)</span>
          <span className="ta-chip">API Token Auth</span>
          <span className="ta-chip">jira-python 3.10</span>
        </div>
      </div>

      {/* AURA UI — the only client of Agent Service */}
      <div className="ta-card ta-card--amber ta-card--flex">
        <div className="ta-card-header-row">
          <div className="ta-card-icon">🖥️</div>
          <div className="ta-card-name">AURA UI</div>
          <div className="ta-card-sub">React 19 · TypeScript · Vite 8</div>
          <GhLink repo="aura-ui" />
        </div>
        <div className="ta-card-note">
          All calls route via Vite proxy: <code>/agent/*</code> → Agent Service <code>:8090</code><br />
          UI never contacts Jira directly
        </div>
        <div className="ta-card-chips">
          <span className="ta-chip">Jira Issues Page</span>
          <span className="ta-chip">Manual Ticket Form</span>
          <span className="ta-chip">Agent Run Viewer</span>
          <span className="ta-chip">Ticket Status</span>
          <span className="ta-chip">SSE Streaming</span>
          <span className="ta-chip ta-chip--port">:3000</span>
        </div>
      </div>

    </div>
  </div>
)

/* ── Layer 2 — Jira Integration Lifecycle ─────────────────── */
const JiraLifecycleLayer = () => (
  <div className="ta-layer">
    <div className="ta-layer-eyebrow" style={{ color: '#2684ff', borderColor: 'rgba(38,132,255,0.3)', background: 'rgba(38,132,255,0.08)' }}>
      Jira Integration Lifecycle
    </div>
    <div className="ta-jira-lifecycle">
      {[
        { step: '1', label: 'Issue Listed', desc: 'Issues fetched; human picks one', color: '#64748b' },
        { step: '2', label: '▶ Run AURA', desc: 'Human clicks → POST /agent/run', color: '#2684ff' },
        { step: '3', label: 'In Progress', desc: 'Issue transitioned + comment added', color: '#f59e0b' },
        { step: '4', label: 'Agent Updates', desc: 'Comment after each of 8 agents', color: '#a78bfa' },
        { step: '5', label: 'Awaiting Approval', desc: 'Human prompted to approve in UI', color: '#fb923c' },
        { step: '6', label: 'Approved / Rejected', desc: 'Decision reflected as comment', color: '#60a5fa' },
        { step: '7', label: 'Done + Resolved', desc: 'Transitioned to Done + resolution comment', color: '#4ade80' },
      ].map((s, i, arr) => (
        <div key={s.step} className="ta-lifecycle-step">
          <div className="ta-lifecycle-node" style={{ borderColor: s.color, background: `${s.color}12` }}>
            <div className="ta-lifecycle-label" style={{ color: s.color }}>{s.step} - {s.label}</div>
            <div className="ta-lifecycle-desc">{s.desc}</div>
          </div>
          {i < arr.length - 1 && (
            <svg className="ta-pipe-arrow" width="18" height="14" viewBox="0 0 18 14">
              <line x1="0" y1="7" x2="10" y2="7" stroke="#334155" strokeWidth="1.5" />
              <polyline points="6,3 14,7 6,11" fill="none" stroke="#334155" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      ))}
    </div>
    <div className="ta-jira-note">
      <span className="ta-jira-note-badge">Webhook</span>
      Jira webhook endpoint <code>POST /agent/webhook/jira</code> is acknowledge-only — it logs the event but never auto-triggers an agent run. All execution is human-initiated.
    </div>
  </div>
)

/* ── Layer 3 — Agent Orchestration ────────────────────────── */
const AgentLayer = () => (
  <div className="ta-layer">
    <div className="ta-layer-eyebrow" style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)' }}>
      Agent Orchestration Layer
    </div>
    <div className="ta-agent-center">
      <div className="ta-agent-main">
        <div className="ta-agent-header">
          <span className="ta-agent-icon">🤖</span>
          <span className="ta-agent-title">AURA Agent Service</span>
          <span className="ta-badge ta-badge--purple">FastAPI · Python 3.11 · :8090</span>
          <GhLink repo="aura-agent-service" />
        </div>
        <div className="ta-agent-body">
          <div className="ta-agent-sub">
            <div className="ta-sub-label">LangGraph StateGraph — 8-node pipeline</div>
            <div className="ta-pipeline">
              {[
                { name: 'SDA',  color: '#f59e0b', label: 'Request Intake\nAgent' },
                { name: 'SPA',  color: '#818cf8', label: 'System Diagnostics\nAgent' },
                { name: 'SME',  color: '#38bdf8', label: 'Expert Advisor\nAgent' },
                { name: 'RAT',  color: '#f97316', label: 'Risk Evaluator\nAgent' },
                { name: 'AUTH', color: '#c084fc', label: 'Change Approver\n(Manual)' },
                { name: 'EA',   color: '#4ade80', label: 'Implementation\nAgent' },
                { name: 'VA',   color: '#2dd4bf', label: 'Change Validation\nAgent' },
                { name: 'SDA★', color: '#f59e0b', label: 'Resolution\nAgent' },
              ].map((a, i, arr) => (
                <div key={a.name} className="ta-pipeline-step">
                  <div className="ta-agent-node" style={{ borderColor: a.color, background: `${a.color}10` }}>
                    <div className="ta-node-name" style={{ color: a.color }}>{a.name}</div>
                    <div className="ta-node-desc">{a.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <svg className="ta-pipe-arrow" width="18" height="14" viewBox="0 0 18 14">
                      <line x1="0" y1="7" x2="10" y2="7" stroke="#334155" strokeWidth="1.5" />
                      <polyline points="6,3 14,7 6,11" fill="none" stroke="#334155" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="ta-agent-sub ta-agent-sub--bottom">
            <div className="ta-agent-info-item">
              <div className="ta-sub-label">LLM Backbone</div>
              <div className="ta-info-pill ta-info-pill--purple">✦ Claude Sonnet 4.6 · Anthropic API</div>
            </div>
            <div className="ta-agent-info-item">
              <div className="ta-sub-label">Rate Limit Guard</div>
              <div className="ta-info-pill">Exponential backoff · 15s→30s→60s→120s</div>
            </div>
            <div className="ta-agent-info-item">
              <div className="ta-sub-label">Human-in-the-Loop</div>
              <div className="ta-info-pill ta-info-pill--purple">AUTH pause · /approve · /reject</div>
            </div>
            <div className="ta-agent-info-item">
              <div className="ta-sub-label">Failure Recovery</div>
              <div className="ta-info-pill ta-info-pill--red">POST /run/{'{id}'}/retry</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

/* ── Layer 4 — TAP Service Mesh ───────────────────────────── */
const ServiceLayer = () => (
  <div className="ta-layer">
    <div className="ta-layer-eyebrow" style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)' }}>
      TAP Service Mesh
    </div>
    <div className="ta-full-row">

      <div className="ta-service-group ta-service-group--flex">
        <div className="ta-group-label" style={{ color: '#f59e0b' }}>☕ Spring Boot · Java 21</div>
        <div className="ta-row ta-row--gap">
          <div className="ta-card ta-card--blue ta-card--flex">
            <div className="ta-card-header-row">
              <div className="ta-card-icon">🔍</div>
              <div className="ta-card-name">TAP Query</div>
            </div>
            <div className="ta-card-sub">Read-only access</div>
            <GhLink repo="aura-tap-query-service" />
            <div className="ta-card-chips">
              <span className="ta-chip">Hotels</span>
              <span className="ta-chip">Locations</span>
              <span className="ta-chip">User EIDs</span>
              <span className="ta-chip ta-chip--port">:8081</span>
            </div>
          </div>
          <div className="ta-card ta-card--blue ta-card--flex">
            <div className="ta-card-header-row">
              <div className="ta-card-icon">✏️</div>
              <div className="ta-card-name">TAP Updater</div>
            </div>
            <div className="ta-card-sub">Write / mutate</div>
            <GhLink repo="aura-tap-updater-service" />
            <div className="ta-card-chips">
              <span className="ta-chip">Create</span>
              <span className="ta-chip">Update</span>
              <span className="ta-chip">Patch</span>
              <span className="ta-chip ta-chip--port">:8082</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ta-service-group ta-service-group--flex">
        <div className="ta-group-label" style={{ color: '#38bdf8' }}>🐍 FastAPI · Python 3.11</div>
        <div className="ta-row ta-row--gap">
          {[
            { icon: '🌐', name: 'MARSHA Client', sub: 'Location + User', port: ':8083', repo: 'aura-marsha-client-service' },
            { icon: '📊', name: 'MINT Client',   sub: 'Location only',   port: ':8084', repo: 'aura-mint-client-service'   },
            { icon: '✈️',  name: 'ACRS Client',   sub: 'Assignments',     port: ':8085', repo: 'aura-acrs-client-service'   },
            { icon: '🔐', name: 'VDS Client',    sub: 'Identity layer',  port: ':8086', repo: 'aura-vds-client-service'    },
          ].map(s => (
            <div key={s.name} className="ta-card ta-card--teal ta-card--flex">
              <div className="ta-card-header-row">
                <div className="ta-card-icon">{s.icon}</div>
                <div className="ta-card-name">{s.name}</div>
              </div>
              <div className="ta-card-sub">{s.sub}</div>
              <GhLink repo={s.repo} />
              <div className="ta-card-chips">
                <span className="ta-chip ta-chip--port">{s.port}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
)

/* ── Layer 5 — Data & Integration Layer ───────────────────── */
const DataLayer = () => (
  <div className="ta-layer">
    <div className="ta-layer-eyebrow" style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)' }}>
      Data &amp; Integration Layer
    </div>
    <div className="ta-full-row">

      {/* MongoDB */}
      <div className="ta-card ta-card--green ta-card--flex">
        <div className="ta-card-header-row">
          <div className="ta-card-icon">🍃</div>
          <div className="ta-card-name">MongoDB</div>
        </div>
        <div className="ta-card-sub">aura_db · :27017</div>
        <div className="ta-card-chips">
          <span className="ta-chip">agent_runs</span>
          <span className="ta-chip">run state</span>
          <span className="ta-chip">agent outputs</span>
        </div>
      </div>

      {/* Jira Cloud (integration target) */}
      <div className="ta-card ta-card--jira ta-card--flex">
        <div className="ta-card-header-row">
          <div className="ta-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2684ff">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 18.298 18.3V6.762a1.005 1.005 0 0 0-1.004-1.005zm5.701-5.757H11.48a5.215 5.215 0 0 0 5.215 5.215h2.13v2.04A5.215 5.215 0 0 0 24 12.47V1.005A1.005 1.005 0 0 0 22.995 0z" />
            </svg>
          </div>
          <div className="ta-card-name">Jira Cloud</div>
        </div>
        <div className="ta-card-sub">atlassian.net · write-back</div>
        <div className="ta-card-chips">
          <span className="ta-chip ta-chip--jira">transition</span>
          <span className="ta-chip">comment × 8</span>
          <span className="ta-chip">fire-and-forget</span>
        </div>
      </div>

      {/* Anthropic API */}
      <div className="ta-card ta-card--purple ta-card--flex">
        <div className="ta-card-header-row">
          <div className="ta-card-icon">✦</div>
          <div className="ta-card-name">Anthropic API</div>
        </div>
        <div className="ta-card-sub">Claude Sonnet 4.6</div>
        <div className="ta-card-chips">
          <span className="ta-chip">8 calls / run</span>
        </div>
      </div>

    </div>
  </div>
)

/* ── Stack summary ────────────────────────────────────────── */
const StackSummary = () => {
  const items = [
    { label: 'UI',       value: 'React 19 + TypeScript + Vite 8',              color: '#818cf8' },
    { label: 'Agents',   value: 'Python 3.11 · FastAPI · LangGraph',            color: '#a78bfa' },
    { label: 'LLM',      value: 'Claude Sonnet 4.6 (Anthropic)',                color: '#c084fc' },
    { label: 'Backend',  value: 'Spring Boot 3.3 · Java 21 · Lombok',            color: '#60a5fa' },
    { label: 'Adapters', value: 'FastAPI · Python 3.11 · httpx',                color: '#38bdf8' },
    { label: 'Database', value: 'MongoDB 7 · PyMongo · aura_db.agent_runs',     color: '#4ade80' },
    { label: 'Jira',     value: 'Jira Cloud · jira-python 3.10 · REST API v3',  color: '#2684ff' },
    { label: 'Tools',    value: 'LangChain · LangGraph · Pydantic v2',          color: '#2dd4bf' },
    { label: 'Infra',    value: 'Uvicorn · Maven · Vite proxy · CORS',          color: '#f59e0b' },
  ]
  return (
    <div className="ta-stack-summary">
      <div className="ta-stack-title">Tech Stack</div>
      {items.map(i => (
        <div key={i.label} className="ta-stack-row">
          <span className="ta-stack-label" style={{ color: i.color }}>{i.label}</span>
          <span className="ta-stack-value">{i.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Port map ─────────────────────────────────────────────── */
const PortMap = () => {
  const ports = [
    { port: ':3000',  name: 'AURA UI',           color: '#818cf8' },
    { port: ':8081',  name: 'TAP Query',           color: '#60a5fa' },
    { port: ':8082',  name: 'TAP Updater',        color: '#60a5fa' },
    { port: ':8083',  name: 'MARSHA Client',      color: '#2dd4bf' },
    { port: ':8084',  name: 'MINT Client',        color: '#2dd4bf' },
    { port: ':8085',  name: 'ACRS Client',        color: '#2dd4bf' },
    { port: ':8086',  name: 'VDS Client',         color: '#2dd4bf' },
    { port: ':8090',  name: 'Agent Service',      color: '#a78bfa' },
    { port: ':27017', name: 'MongoDB',            color: '#4ade80' },
    { port: 'cloud',  name: 'Jira · atlassian.net', color: '#2684ff' },
    { port: 'cloud',  name: 'Anthropic API',      color: '#c084fc' },
  ]
  return (
    <div className="ta-port-map">
      <div className="ta-port-title">Service Port Map</div>
      <div className="ta-port-grid">
        {ports.map((p, idx) => (
          <div key={`${p.port}-${idx}`} className="ta-port-row">
            <span className="ta-port-badge" style={{ color: p.color, borderColor: `${p.color}40`, background: `${p.color}10` }}>
              {p.port}
            </span>
            <span className="ta-port-name">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Root ─────────────────────────────────────────────────── */
export default function TechArchitecture() {
  return (
    <div className="ta-container">
      <div className="ta-section-header">
        <h2 className="ta-section-title">Technical Architecture</h2>
        <p className="ta-section-desc">
          React UI · LangGraph 8-agent pipeline · Spring Boot services · Python adapters · MongoDB · Anthropic API — wired end-to-end for autonomous incident resolution with full Jira lifecycle write-back.
        </p>
      </div>

      <div className="ta-diagram">
        <InputLayer />
        <MergeConn />
        <JiraLifecycleLayer />
        <VConn color="#334155" />
        <AgentLayer />
        <VConn color="#334155" />
        <div className="ta-row-pair">
          <ServiceLayer />
          <DataLayer />
        </div>
      </div>

      <div className="ta-footer-row">
        <StackSummary />
        <PortMap />
      </div>
    </div>
  )
}
