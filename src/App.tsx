import { useState } from 'react'
import './App.css'

/* ── Marriott-style M mark ──────────────────────────────────────────────── */
function MarriottM({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 46"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Full-width block at top with inner-V cutout — mirrors Marriott M shape */}
      <path
        d="M 0,46 L 0,0 L 40,0 L 40,46 L 33,46 L 33,14 L 20,28 L 7,14 L 7,46 Z"
        fill="#A8003B"
      />
    </svg>
  )
}
import FrameworkDiagram from './components/FrameworkDiagram'
import TapEcosystem from './components/TapEcosystem'
import TechArchitecture from './components/TechArchitecture'
import AgentRun from './components/AgentRun'
import TicketStatus from './components/TicketStatus'
import JiraIssues from './components/JiraIssues'

type Page = 'home' | 'ecosystem' | 'framework' | 'architecture' | 'team' | 'jira' | 'disclaimer' | 'status' | 'run'

interface NavItem {
  page: Page
  label: string
  cls?: string
}

const NAV_ITEMS: NavItem[] = [
  { page: 'ecosystem',    label: 'TAP Ecosystem'    },
  { page: 'framework',    label: 'AURA Framework'   },
  { page: 'architecture', label: 'Tech Architecture' },
  { page: 'jira',         label: 'Jira Issues',   cls: 'nav-jira-btn'       },
  { page: 'status',       label: 'Ticket Status', cls: 'nav-status-btn'     },
  { page: 'run',          label: '▶ Run Agent',   cls: 'nav-run-btn'        },
  // { page: 'team',         label: 'Team'             },  // hidden — re-enable when ready
  { page: 'disclaimer',   label: 'Disclaimer',    cls: 'nav-disclaimer-btn' },
]

const TEAM = [
  { name: 'Tamilselvan',   role: 'Overall Architecture · AI & Agentic Design · Orchestration', tag: 'LangGraph · Claude API · FastAPI',  icon: '🤖' },
  { name: 'Suresh',        role: 'Frontend & UI/UX · Jira Integration',                        tag: 'React 19 · TypeScript · Jira API',  icon: '🖥️' },
  { name: 'Bhagvan (MTA)', role: 'Backend Spring Boot Services',                               tag: 'Spring Boot · Java 21',             icon: '☕' },
  { name: 'Hemant (MTA)',  role: 'FastAPI Python Services',                                    tag: 'FastAPI · Python 3.11',             icon: '🐍' },
]

function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner">
      <span className="disclaimer-banner-icon">⚠</span>
      <span>
        No Marriott production or non-production data, systems, services, microservices, or source code
        are used in this product. This is an independent Marriott Codefest 4.0 prototype built solely for demonstration purposes.
      </span>
    </div>
  )
}

function AppHeader({ page, onNav }: { page: Page; onNav: (p: Page) => void }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <button className="logo-badge" onClick={() => onNav('home')}>
          <img src="/favicon.svg" className="logo-badge-icon" alt="" />
          <MarriottM className="logo-maura-m" />AURA
        </button>
        <nav className="nav-links">
          {NAV_ITEMS.map(({ page: p, label, cls }) => (
            <button
              key={p}
              className={[
                'nav-link',
                cls ?? '',
                page === p ? 'nav-link--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onNav(p)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function DisclaimerBox() {
  return (
    <div className="disclaimer-box">
      <span className="disclaimer-icon">ℹ</span>
      <div>
        <p className="disclaimer-title">Disclaimer</p>
        <ul className="disclaimer-list">
          <li>No Marriott production or non-production data is used in this product.</li>
          <li>No Marriott production or non-production system services are connected to this product.</li>
          <li>No Marriott production or non-production microservices are used in this product.</li>
          <li>No Marriott production or non-production source code is used in building this product.</li>
        </ul>
        <p className="disclaimer-note">
          AURA is an independent Marriott Codefest 4.0 prototype. System behavior may vary based on the chosen
          backbone language models, model temperature, issue complexity, data quality, and other
          non-deterministic factors.
        </p>
      </div>
    </div>
  )
}

/* ── Individual pages ───────────────────────────────────────────────────── */

function HomePage({ onRunAgent }: { onRunAgent: () => void }) {
  return (
    <div className="page-content page-home">
      <section className="hero-section">
        <div className="hero-badge">Marriott Codefest 4.0</div>
        <h1 className="hero-title">
          <MarriottM className="hero-maura-m" /><span className="aura-text">AURA</span>
        </h1>
        <p className="hero-full-name">
          <span className="hero-full-m">Marriott</span>{' '}
          <span className="hero-full-aura">Autonomous Unified Resolution Agent</span>
        </p>
        <p className="hero-description">
          A multi-agent AI framework that handles production support tasks. By deploying specialized
          LLM-powered agents — from service desk analysts, domain and system experts — which evaluates
          production problems and provides solutions. These agents engage in dynamic discussions and
          decision making to pinpoint the optimal strategy to resolve issues quickly.
        </p>
        <button className="hero-cta" onClick={onRunAgent}>
          ▶ Run mAURA Agents
        </button>
      </section>
      <div className="page-disclaimer">
        <DisclaimerBox />
      </div>
    </div>
  )
}

function EcosystemPage() {
  return (
    <div className="page-content" key="ecosystem">
      <TapEcosystem />
    </div>
  )
}

function FrameworkPage() {
  return (
    <div className="page-content" key="framework">
      <FrameworkDiagram />
    </div>
  )
}

function ArchitecturePage() {
  return (
    <div className="page-content" key="architecture">
      <TechArchitecture />
    </div>
  )
}

function TeamPage() {
  return (
    <div className="page-content page-team" key="team">
      <div className="team-section">
        <div className="team-header">
          <div className="team-eyebrow">Marriott Codefest 4.0</div>
          <h2 className="team-title">Meet the Team</h2>
          <p className="team-desc">
            The engineers behind AURA — built in 48 hours for Marriott Codefest 4.0.
          </p>
        </div>

        {/* Mentor */}
        <div className="team-mentor-wrap">
          <div className="team-mentor-label">Mentor &amp; Senior Advisor</div>
          <div className="team-mentor-card">
            <div className="team-mentor-icon">🌟</div>
            <div className="team-mentor-info">
              <div className="team-mentor-name">Paul</div>
              <div className="team-mentor-role">Senior Director</div>
              <div className="team-mentor-desc">
                Provided full guidance, strategic direction, and mentorship throughout the project.
                Reviewed architecture decisions, fine-tuned application design, and ensured
                alignment with Marriott's engineering standards.
              </div>
            </div>
            <div className="team-mentor-badges">
              <span className="team-mentor-badge">Architecture Review</span>
              <span className="team-mentor-badge">Strategic Guidance</span>
            </div>
          </div>
        </div>

        {/* Engineering team */}
        <div className="team-eng-label">Engineering Team</div>
        <div className="team-grid">
          {TEAM.map((m) => (
            <div key={m.name} className="team-card">
              <div className="team-card-icon">{m.icon}</div>
              <div className="team-card-name">{m.name}</div>
              <div className="team-card-role">{m.role}</div>
              <div className="team-card-tag">{m.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DisclaimerPage() {
  return (
    <div className="page-content page-disclaimer-full" key="disclaimer">
      <div className="disclaimer-page-inner">
        <div className="disclaimer-page-header">
          <div className="team-eyebrow">Marriott Codefest 4.0</div>
          <h2 className="team-title">Disclaimer</h2>
          <p className="team-desc">
            Important information about the scope and limitations of this prototype.
          </p>
        </div>

        <div className="disclaimer-page-card">
          <span className="disclaimer-icon" style={{ fontSize: '1.25rem' }}>ℹ</span>
          <div>
            <p className="disclaimer-title">Data & Systems</p>
            <ul className="disclaimer-list">
              <li>No Marriott production or non-production data is used in this product.</li>
              <li>No Marriott production or non-production system services are connected to this product.</li>
              <li>No Marriott production or non-production microservices are used in this product.</li>
              <li>No Marriott production or non-production source code is used in building this product.</li>
            </ul>
          </div>
        </div>

        <div className="disclaimer-page-card">
          <span className="disclaimer-icon" style={{ fontSize: '1.25rem' }}>⚠</span>
          <div>
            <p className="disclaimer-title">Prototype Notice</p>
            <p className="disclaimer-box" style={{ border: 'none', background: 'none', padding: 0, display: 'block' }}>
              <span className="disclaimer-note" style={{ fontStyle: 'normal' }}>
                AURA is an independent Marriott Codefest 4.0 prototype built solely for demonstration
                purposes. It is not affiliated with, endorsed by, or connected to Marriott International
                in any official capacity.
              </span>
            </p>
          </div>
        </div>

        <div className="disclaimer-page-card">
          <span className="disclaimer-icon" style={{ fontSize: '1.25rem' }}>🤖</span>
          <div>
            <p className="disclaimer-title">AI Behaviour</p>
            <p className="disclaimer-note" style={{ fontStyle: 'normal', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>
              System behaviour may vary based on the chosen backbone language models, model temperature,
              issue complexity, data quality, and other non-deterministic factors inherent to large
              language model outputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Root ───────────────────────────────────────────────────────────────── */

function App() {
  const [page, setPage]                   = useState<Page>('home')
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>()

  const openRun = (runId?: string) => {
    setSelectedRunId(runId)
    setPage('run')
  }

  const goHome = () => setPage('home')

  /* ── Full-screen pages (own header, no app shell) ── */
  if (page === 'status') {
    return <TicketStatus onViewRun={(runId) => openRun(runId)} onBack={goHome} />
  }
  if (page === 'run') {
    return <AgentRun initialRunId={selectedRunId} onBack={goHome} />
  }

  /* ── App-shell pages (persistent nav always visible) ── */
  return (
    <div className="app">
      <DisclaimerBanner />
      <AppHeader page={page} onNav={(p) => p === 'run' ? openRun() : setPage(p)} />
      <main className="main-content">
        {page === 'home'         && <HomePage onRunAgent={() => openRun()} />}
        {page === 'ecosystem'    && <EcosystemPage />}
        {page === 'framework'    && <FrameworkPage />}
        {page === 'architecture' && <ArchitecturePage />}
        {page === 'team'         && <TeamPage />}
        {page === 'jira'         && <JiraIssues onRunAgent={(runId) => openRun(runId)} />}
        {page === 'disclaimer'   && <DisclaimerPage />}
      </main>
    </div>
  )
}

export default App
