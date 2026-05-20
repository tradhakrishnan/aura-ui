import './FrameworkDiagram.css'

const DataSources = () => (
  <div className="fd-column fd-sources">
    <div className="fd-source-box">
      <div className="fd-source-icon">🎫</div>
      <div>
        <div className="fd-source-title">ServiceNow / Jira</div>
        <div className="fd-source-chips">
          <span className="fd-chip">Complaint Details</span>
          <span className="fd-chip">Issue Tracking</span>
        </div>
      </div>
    </div>
    <div className="fd-source-box">
      <div className="fd-source-icon">⚙️</div>
      <div>
        <div className="fd-source-title">TAP Services</div>
        <div className="fd-source-chips">
          <span className="fd-chip">Microservice Access</span>
          <span className="fd-chip">Data Verification</span>
        </div>
      </div>
    </div>
    <div className="fd-source-box">
      <div className="fd-source-icon">📖</div>
      <div>
        <div className="fd-source-title">TAP Functions</div>
        <div className="fd-source-chips">
          <span className="fd-chip">Confluence</span>
          <span className="fd-chip">Process & Procedures</span>
        </div>
      </div>
    </div>
  </div>
)

const HArrow = ({ label, color = '#475569', wide = false }: { label?: string; color?: string; wide?: boolean }) => (
  <div className={`fd-arrow-col${wide ? ' fd-arrow-col--wide' : ''}`}>
    {label && <span className="fd-arrow-label-text">{label}</span>}
    <svg width={wide ? 48 : 32} height="16" viewBox={wide ? '0 0 48 16' : '0 0 32 16'}>
      <line x1="0" y1="8" x2={wide ? 40 : 24} y2="8" stroke={color} strokeWidth="1.5" />
      <polyline points={wide ? '36,4 44,8 36,12' : '20,4 28,8 20,12'} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  </div>
)

const VArrow = ({ label, color = '#475569' }: { label?: string; color?: string }) => (
  <div className="fd-varrow">
    <svg width="16" height="28" viewBox="0 0 16 28">
      <line x1="8" y1="0" x2="8" y2="20" stroke={color} strokeWidth="1.5" strokeDasharray="4,2" />
      <polyline points="4,16 8,24 12,16" fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
    {label && <span className="fd-varrow-label" style={{ color }}>{label}</span>}
  </div>
)

const TechSupportTeam = () => (
  <div className="fd-column fd-support-team">
    <div className="fd-team-wrapper">
      <div className="fd-researcher-box fd-green">
        <div className="fd-researcher-icon">📈</div>
        <div className="fd-researcher-label green">Root Cause<br />Identified</div>
      </div>
      <div className="fd-discussion-pill"><span>⇅</span> Discussion</div>
      <div className="fd-researcher-box fd-red">
        <div className="fd-researcher-icon">📉</div>
        <div className="fd-researcher-label red">Issue<br />Unresolved</div>
      </div>
    </div>
    <div className="fd-team-label">Tech Support Team</div>
  </div>
)

const TechLead = () => (
  <div className="fd-column fd-tech-lead">
    <div className="fd-lead-wrapper">
      <div className="fd-person-avatar">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="14" r="8" fill="#a78bfa" opacity="0.8" />
          <ellipse cx="20" cy="32" rx="13" ry="8" fill="#a78bfa" opacity="0.6" />
        </svg>
      </div>
      <div className="fd-lead-title">Tech Lead</div>
      <div className="fd-lead-subtitle">(Human)</div>
      <div className="fd-ai-badge"><span>✦</span> OpenAI o1 Deep Thinking</div>
    </div>
  </div>
)

const RiskManagement = () => (
  <div className="fd-column fd-risk">
    <div className="fd-risk-header">Risk Management Team</div>
    <div className="fd-risk-body">
      <div className="fd-risk-row">
        <div className="fd-risk-dot" style={{ background: '#f97316' }} />
        <span className="fd-risk-name" style={{ color: '#f97316' }}>Immediate</span>
      </div>
      <div className="fd-risk-row">
        <div className="fd-risk-dot" style={{ background: '#94a3b8' }} />
        <span className="fd-risk-name" style={{ color: '#94a3b8' }}>Normal</span>
      </div>
      <div className="fd-risk-row">
        <div className="fd-risk-dot" style={{ background: '#60a5fa' }} />
        <span className="fd-risk-name" style={{ color: '#60a5fa' }}>Escalated</span>
      </div>
    </div>
  </div>
)

const ValidationAgent = () => (
  <div className="fd-validation">
    <div className="fd-validation-header">
      <span className="fd-validation-icon">🔍</span>
      <span className="fd-validation-title">Validation Agent</span>
    </div>
    <div className="fd-validation-checks">
      <div className="fd-check-row">
        <span className="fd-check-icon">✓</span>
        <span>Microservice health check</span>
      </div>
      <div className="fd-check-row">
        <span className="fd-check-icon">✓</span>
        <span>API response verification</span>
      </div>
      <div className="fd-check-row">
        <span className="fd-check-icon">✓</span>
        <span>Data integrity validated</span>
      </div>
    </div>
    <div className="fd-validation-result">
      <span className="fd-result-dot" />
      All checks passed
    </div>
  </div>
)

const TicketClosed = () => (
  <div className="fd-ticket-closed">
    <div className="fd-ticket-icon">🎫</div>
    <div className="fd-ticket-status">
      <div className="fd-ticket-badge">✔ Auto-Closed</div>
      <div className="fd-ticket-title">ServiceNow / Jira</div>
      <div className="fd-ticket-subtitle">Status: Resolved</div>
    </div>
    <div className="fd-ticket-loop-label">Full loop complete</div>
  </div>
)

// Right section: PO on top, then Execution → Validation → Ticket Closed below
const RightSection = () => (
  <div className="fd-right-section">
    {/* Row 1: Product Owner */}
    <div className="fd-po-box">
      <div className="fd-person-avatar">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="14" r="8" fill="#60a5fa" opacity="0.8" />
          <ellipse cx="20" cy="32" rx="13" ry="8" fill="#60a5fa" opacity="0.6" />
        </svg>
      </div>
      <div className="fd-po-title">Product Owner</div>
    </div>

    {/* Connector down to Execution */}
    <VArrow label="Approve" color="#475569" />

    {/* Row 2: Execution → Validation Agent → Ticket Closed */}
    <div className="fd-execution-row">
      {/* Execution */}
      <div className="fd-exec-box">
        <div className="fd-exec-icon">⚡</div>
        <div className="fd-exec-title">Execution</div>
        <div className="fd-exec-subtitle">Prod / Non-Prod</div>
      </div>

      {/* Arrow → Validation */}
      <div className="fd-inline-arrow">
        <svg width="36" height="14" viewBox="0 0 36 14">
          <line x1="0" y1="7" x2="28" y2="7" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4,2" />
          <polyline points="24,3 32,7 24,11" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
        </svg>
        <span className="fd-inline-label" style={{ color: '#2dd4bf' }}>Validate Fix</span>
      </div>

      <ValidationAgent />

      {/* Arrow → Ticket Closed */}
      <div className="fd-inline-arrow">
        <svg width="36" height="14" viewBox="0 0 36 14">
          <line x1="0" y1="7" x2="28" y2="7" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4,2" />
          <polyline points="24,3 32,7 24,11" fill="none" stroke="#4ade80" strokeWidth="1.5" />
        </svg>
        <span className="fd-inline-label" style={{ color: '#4ade80' }}>All Pass</span>
      </div>

      <TicketClosed />
    </div>
  </div>
)

const TeamOverview = () => (
  <div className="fd-team-overview">
    <div className="fd-overview-icon">
      <svg viewBox="0 0 32 32" width="28" height="28">
        <circle cx="10" cy="10" r="5" fill="#94a3b8" opacity="0.7" />
        <circle cx="22" cy="10" r="5" fill="#94a3b8" opacity="0.5" />
        <ellipse cx="10" cy="24" rx="8" ry="5" fill="#94a3b8" opacity="0.7" />
        <ellipse cx="22" cy="24" rx="8" ry="5" fill="#94a3b8" opacity="0.5" />
      </svg>
    </div>
    <div className="fd-overview-content">
      <div className="fd-overview-title">Team Overview</div>
      <div className="fd-overview-rows">
        <div className="fd-overview-row"><span className="fd-overview-role">Analyst:</span> Gathers service desk key points</div>
        <div className="fd-overview-row"><span className="fd-overview-role">Researcher:</span> Evaluates issue / impact</div>
        <div className="fd-overview-row"><span className="fd-overview-role">Tech Lead:</span> Confirms the root cause</div>
        <div className="fd-overview-row"><span className="fd-overview-role">Risk Team:</span> Manages escalation priority</div>
        <div className="fd-overview-row"><span className="fd-overview-role">Product Owner:</span> Authorizes changes</div>
        <div className="fd-overview-row"><span className="fd-overview-role">Validation Agent:</span> Verifies fix via microservices</div>
      </div>
    </div>
  </div>
)

export default function FrameworkDiagram() {
  return (
    <div className="fd-container">
      <div className="fd-section-header">
        <div className="fd-section-eyebrow">Multi-Agent AI</div>
        <h2 className="fd-section-title">AURA Framework</h2>
        <p className="fd-section-desc">
          Specialized LLM-powered agents collaborate in real time — from service desk analysts
          and domain experts to a human Tech Lead and Product Owner — to diagnose, escalate,
          resolve, validate and auto-close production incidents end-to-end.
        </p>
      </div>

      <div className="fd-diagram">
        <DataSources />

        <HArrow />

        <TechSupportTeam />

        <div className="fd-arrow-col fd-dual-arrow">
          <div className="fd-evidence-arrow">
            <span className="fd-evidence-label" style={{ color: '#4ade80' }}>Root Cause Evidence</span>
            <svg width="36" height="14" viewBox="0 0 36 14">
              <line x1="0" y1="7" x2="28" y2="7" stroke="#4ade80" strokeWidth="1.5" />
              <polyline points="24,3 32,7 24,11" fill="none" stroke="#4ade80" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="fd-evidence-arrow">
            <span className="fd-evidence-label" style={{ color: '#f87171' }}>Unresolved Evidence</span>
            <svg width="36" height="14" viewBox="0 0 36 14">
              <line x1="0" y1="7" x2="28" y2="7" stroke="#f87171" strokeWidth="1.5" />
              <polyline points="24,3 32,7 24,11" fill="none" stroke="#f87171" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        <TechLead />

        <HArrow label={'Transaction\nProposal'} wide />

        <RiskManagement />

        <HArrow label="Decision" wide />

        <RightSection />
      </div>

      <TeamOverview />
    </div>
  )
}
