import { useState } from 'react'
import './UseCases.css'

interface UseCase {
  id: string
  title: string
  line1: string
  line2: string
  icon: string
  color: string
  tag: string
  scenario: string
  agents: string[]
  agentColors: string[]
  steps: string[]
  metrics: { label: string; value: string }[]
  systems: string[]
}

const USE_CASES: UseCase[] = [
  {
    id: 'permission',
    title: 'Permission Gap Resolution',
    line1: 'Permission',
    line2: 'Fix',
    icon: '🔐',
    color: '#c084fc',
    tag: 'Most Common · 60–70% of all tickets',
    scenario: 'A user EID is missing a required system permission — Revenue Manager in ACRS, rate access in MARSHA, location visibility in MINT, or identity in VDS. AURA diagnoses the gap, classifies risk, gets human approval, patches the permission, validates, and auto-closes.',
    agents: ['SDA', 'SPA', 'SME', 'RAT', 'AUTH', 'EA', 'VA', 'SDA*'],
    agentColors: ['#f59e0b','#818cf8','#38bdf8','#f97316','#c084fc','#4ade80','#2dd4bf','#f59e0b'],
    steps: [
      'SDA parses EID, target system & permission from ticket text',
      'SPA queries TAP Query + VDS for user profile & permissions',
      'SME confirms the permission gap as root cause',
      'RAT classifies fix risk: Immediate or Normal',
      'AUTHORIZER pauses — operator reviews full analysis',
      'EA patches permission via TAP Updater API',
      'VA re-queries to confirm permission is now active',
      'SDA writes resolution summary and closes ticket',
    ],
    metrics: [
      { label: 'MTTR Before', value: '47 min' },
      { label: 'MTTR After',  value: '4 min'  },
      { label: 'Time Saved',  value: '91%'    },
      { label: 'Tokens',      value: '~8K'    },
    ],
    systems: ['TAP Query :8081', 'TAP Updater :8082', 'VDS :8086'],
  },
  {
    id: 'hotel',
    title: 'Hotel / Location Misconfiguration',
    line1: 'Hotel',
    line2: 'Config',
    icon: '🏨',
    color: '#60a5fa',
    tag: 'Configuration · High volume',
    scenario: "A hotel code is missing from a control location's managed properties list, causing booking or rate visibility failures. AURA queries the location record, validates the hotel code, adds it to the controlledHotels array, and confirms the fix.",
    agents: ['SDA', 'SPA', 'SME', 'RAT', 'AUTH', 'EA', 'VA', 'SDA*'],
    agentColors: ['#f59e0b','#818cf8','#38bdf8','#f97316','#c084fc','#4ade80','#2dd4bf','#f59e0b'],
    steps: [
      'SDA extracts hotel code and location code from ticket text',
      'SPA queries MARSHA for location record and controlledHotels array',
      'SME cross-references ACRS to confirm hotel code validity',
      'RAT classifies: Normal risk — data add, reversible',
      'AUTHORIZER presents hotel to location diff to operator',
      'EA adds hotel code to location controlledHotels array',
      'VA queries MARSHA to verify hotel appears in location',
      'SDA closes with full change record attached',
    ],
    metrics: [
      { label: 'MTTR Before', value: '52 min' },
      { label: 'MTTR After',  value: '5 min'  },
      { label: 'Time Saved',  value: '90%'    },
      { label: 'Systems Hit', value: '3'      },
    ],
    systems: ['MARSHA :8083', 'ACRS :8085', 'TAP Updater :8082'],
  },
  {
    id: 'multisystem',
    title: 'Multi-System Root Cause Analysis',
    line1: 'Multi',
    line2: 'System',
    icon: '🔍',
    color: '#f59e0b',
    tag: 'Complex · SPA and SME iterative loop',
    scenario: 'Complex incidents span multiple systems — issues visible in MARSHA but originating in ACRS, or config conflicts between MINT and VDS. SPA and SME engage in iterative discussion up to 3 rounds to reach consensus on root cause before producing a targeted fix plan.',
    agents: ['SDA', 'SPA', 'SME', 'loop x3', 'RAT', 'AUTH', 'EA', 'VA'],
    agentColors: ['#f59e0b','#818cf8','#38bdf8','#64748b','#f97316','#c084fc','#4ade80','#2dd4bf'],
    steps: [
      'SDA identifies multi-system signals in the ticket description',
      'SPA performs broad query across all relevant systems',
      'SME evaluates findings — requests deeper research if needed',
      'SPA and SME loop: up to 3 iterations to reach consensus',
      'RAT assesses cross-system change risk (often Escalated)',
      'AUTHORIZER presents full discussion chain to operator',
      'EA applies targeted fix to the identified root system',
      'VA validates across all affected systems simultaneously',
    ],
    metrics: [
      { label: 'Max Iterations', value: '3'     },
      { label: 'MTTR After',     value: '8 min' },
      { label: 'Time Saved',     value: '83%'   },
      { label: 'Tokens',         value: '~15K'  },
    ],
    systems: ['MARSHA :8083', 'ACRS :8085', 'MINT :8084', 'VDS :8086'],
  },
  {
    id: 'jira',
    title: 'Jira-to-Resolution Automation',
    line1: 'Jira',
    line2: 'End-to-End',
    icon: '🔗',
    color: '#2684ff',
    tag: 'Full lifecycle · zero manual Jira updates',
    scenario: 'A Jira issue drives the complete AURA lifecycle — one-click trigger on the Issues page, automatic In Progress transition, 8 agent progress comments, human approval prompt, and a final resolution comment when the issue is transitioned to Done automatically.',
    agents: ['Jira', '8 Agents', 'Jira Done'],
    agentColors: ['#2684ff','#a78bfa','#2684ff'],
    steps: [
      'Operator opens Jira Issues page — all project issues fetched',
      'Clicks Run AURA — issue transitions to In Progress',
      'AURA has picked up this issue comment added to Jira',
      'Each of 8 agent nodes appends a progress comment',
      'Awaiting Approval comment prompts operator to review in UI',
      'Approve or Reject decision reflected as Jira comment',
      'Resolution comment added with full agent analysis',
      'Issue automatically transitioned to Done',
    ],
    metrics: [
      { label: 'Jira Comments',  value: '8+'      },
      { label: 'Manual Updates', value: '0'       },
      { label: 'Transitions',    value: '2'       },
      { label: 'Trigger',        value: '1 click' },
    ],
    systems: ['Jira Cloud', 'jira_client.py', 'All 8 agents'],
  },
  {
    id: 'risk',
    title: 'Risk-Gated Safe Execution',
    line1: 'Risk',
    line2: 'Gate',
    icon: '⚡',
    color: '#f97316',
    tag: 'Safety-first · 100% human oversight',
    scenario: 'Before any system change, the Risk Assessment Team classifies the fix as Immediate, Normal, or Escalated. The Authorizer pauses the pipeline and surfaces the full analysis in the UI. No code path exists for autonomous execution without an explicit human approval.',
    agents: ['RAT', 'AUTH', 'EA or Stop'],
    agentColors: ['#f97316','#c084fc','#4ade80'],
    steps: [
      'RAT receives SME-confirmed fix plan and full ticket context',
      'Evaluates: data sensitivity, reversibility, blast radius',
      'Classifies as Immediate, Normal, or Escalated',
      'AUTHORIZER pauses pipeline — state persisted to MongoDB',
      'UI renders: SDA summary, SPA root cause, SME plan, risk level',
      'Operator clicks Approve or Reject in the AURA UI',
      'Approve: EA executes the fix immediately',
      'Reject: pipeline stops, rejection note saved to ticket',
    ],
    metrics: [
      { label: 'Approval Required', value: '100%'  },
      { label: 'Risk Levels',       value: '3'     },
      { label: 'Auto-Execute',      value: 'Never' },
      { label: 'Audit Trail',       value: 'Full'  },
    ],
    systems: ['MongoDB (state)', 'AURA UI :3000', 'TAP Updater :8082'],
  },
  {
    id: 'audit',
    title: 'Full Audit Trail & Auto-Closure',
    line1: 'Audit',
    line2: 'Trail',
    icon: '📋',
    color: '#4ade80',
    tag: 'Compliance · zero manual ticket write-up',
    scenario: 'Every AURA run produces a complete tamper-evident record: all 8 agent outputs, the approval decision, every system call by EA, all validation results from VA, and a professional closure summary. Tickets auto-close with full documentation.',
    agents: ['All 8 agents', 'MongoDB', 'SDA close'],
    agentColors: ['#a78bfa','#4ade80','#f59e0b'],
    steps: [
      'Every agent node output stored in MongoDB agent_runs collection',
      'Run state transitions logged with precise timestamps',
      'Approval or rejection decision stored with operator context',
      'EA records every system call and its HTTP response',
      'VA records each validation check and pass or fail status',
      'SDA-close synthesises all prior outputs into resolution summary',
      'Ticket status set to Closed with closure timestamp',
      'Full run accessible in Ticket Status page for post-incident review',
    ],
    metrics: [
      { label: 'Records / Run',   value: '8+'        },
      { label: 'Manual Write-up', value: 'Zero'      },
      { label: 'Closure Time',    value: '< 1 min'   },
      { label: 'Retention',       value: 'Permanent' },
    ],
    systems: ['MongoDB aura_db', 'Ticket Status UI', 'Jira (comments)'],
  },
]

/* ── Tree diagram ─────────────────────────────────────────── */
function TreeDiagram({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="uc-tree">
      {/* AURA root node */}
      <div className="uc-root-wrap">
        <div className="uc-root-node">
          <span className="uc-root-icon">✦</span>
          <span className="uc-root-title">AURA</span>
          <span className="uc-root-sub">8-Agent Pipeline · LangGraph · Claude Sonnet</span>
        </div>
      </div>

      {/* Trunk: vertical drop from AURA to horizontal bar */}
      <div className="uc-trunk" />

      {/* Tab row — horizontal bar + 6 branch verticals via CSS */}
      <div className="uc-tab-row">
        {USE_CASES.map((uc, i) => {
          const isActive = active === uc.id
          return (
            <button
              key={uc.id}
              className={`uc-tab${isActive ? ' uc-tab--active' : ''}`}
              onClick={() => onSelect(uc.id)}
              style={isActive ? {
                borderColor: uc.color,
                background: `${uc.color}12`,
                boxShadow: `0 0 0 1px ${uc.color}28, 0 4px 16px ${uc.color}18`,
              } : undefined}
            >
              <span className="uc-tab-icon">{uc.icon}</span>
              <span
                className="uc-tab-num"
                style={{ color: isActive ? uc.color : '#475569' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="uc-tab-name"
                style={{ color: isActive ? uc.color : '#94a3b8' }}
              >
                {uc.line1}
              </span>
              <span className="uc-tab-sub2">{uc.line2}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Detail panel ─────────────────────────────────────────── */
function DetailPanel({ uc }: { uc: UseCase }) {
  const half = Math.ceil(uc.steps.length / 2)
  const stepsLeft  = uc.steps.slice(0, half)
  const stepsRight = uc.steps.slice(half)

  const agentElements: React.ReactNode[] = []
  uc.agents.forEach((agent, i) => {
    agentElements.push(
      <span
        key={`chip-${i}`}
        className="uc-agent-chip"
        style={{
          color: uc.agentColors[i],
          background: `${uc.agentColors[i]}15`,
          borderColor: `${uc.agentColors[i]}30`,
        }}
      >
        {agent}
      </span>
    )
    if (i < uc.agents.length - 1) {
      agentElements.push(
        <span key={`arrow-${i}`} className="uc-agent-arrow">›</span>
      )
    }
  })

  return (
    <div className="uc-detail" key={uc.id}>
      {/* Header row */}
      <div className="uc-detail-head">
        <div className="uc-detail-icon" style={{ background: `${uc.color}18`, borderColor: `${uc.color}30` }}>
          {uc.icon}
        </div>
        <div className="uc-detail-meta">
          <h3 className="uc-detail-title" style={{ color: uc.color }}>{uc.title}</h3>
          <span className="uc-detail-tag">{uc.tag}</span>
        </div>
        <div className="uc-detail-metrics-row">
          {uc.metrics.map(m => (
            <div key={m.label} className="uc-detail-metric" style={{ borderColor: `${uc.color}25` }}>
              <span className="uc-detail-metric-val" style={{ color: uc.color }}>{m.value}</span>
              <span className="uc-detail-metric-lbl">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body: left (scenario + pipeline + systems) | right (steps) */}
      <div className="uc-detail-body">
        <div className="uc-detail-left">
          <p className="uc-detail-scenario">{uc.scenario}</p>

          <div className="uc-divider">Agent Pipeline</div>
          <div className="uc-agents">{agentElements}</div>

          <div className="uc-divider" style={{ marginTop: '0.75rem' }}>Systems</div>
          <div className="uc-systems">
            {uc.systems.map(s => (
              <span key={s} className="uc-sys-chip">{s}</span>
            ))}
          </div>
        </div>

        <div className="uc-detail-right">
          <div className="uc-divider">Steps</div>
          <div className="uc-steps-grid">
            <div className="uc-steps-col">
              {stepsLeft.map((s, i) => (
                <div key={i} className="uc-step">
                  <span className="uc-step-num" style={{ background: `${uc.color}20`, color: uc.color }}>
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="uc-steps-col">
              {stepsRight.map((s, i) => (
                <div key={i} className="uc-step">
                  <span className="uc-step-num" style={{ background: `${uc.color}20`, color: uc.color }}>
                    {half + i + 1}
                  </span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Root ─────────────────────────────────────────────────── */
export default function UseCases() {
  const [active, setActive] = useState<string>(USE_CASES[0].id)
  const selected = USE_CASES.find(uc => uc.id === active)!

  return (
    <div className="uc-container">
      <div className="uc-header">
        <div className="uc-eyebrow">Marriott Codefest 4.0</div>
        <h2 className="uc-title">Production Use Cases</h2>
        <p className="uc-desc">
          Six production support scenarios AURA handles end-to-end. Click any use case to explore
          the full agent pipeline, steps, and outcomes.
        </p>
      </div>

      <TreeDiagram active={active} onSelect={setActive} />

      <DetailPanel uc={selected} />
    </div>
  )
}
