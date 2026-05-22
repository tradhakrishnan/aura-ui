import { useState, useEffect } from 'react'
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
import { getLlmConfig, setLlmProvider, type LlmConfig } from './api/agentApi'
import FrameworkDiagram from './components/FrameworkDiagram'
import TapEcosystem from './components/TapEcosystem'
import TechArchitecture from './components/TechArchitecture'
import UseCases from './components/UseCases'
import AgentRun from './components/AgentRun'
import TicketStatus from './components/TicketStatus'
import JiraIssues from './components/JiraIssues'

type Page = 'home' | 'ecosystem' | 'framework' | 'architecture' | 'usecases' | 'team' | 'jira' | 'disclaimer' | 'status' | 'run'

interface NavItem {
  page: Page
  label: string
  cls?: string
}

const NAV_ITEMS: NavItem[] = [
  // { page: 'ecosystem',    label: 'TAP Ecosystem'    },  // hidden
  { page: 'framework',    label: 'AURA Framework'   },
  { page: 'architecture', label: 'Tech Architecture' },
  { page: 'usecases',     label: 'Use Cases'        },
  { page: 'status',       label: 'Ticket Status', cls: 'nav-status-btn'     },
  { page: 'run',          label: '▶ Run AURA Agents', cls: 'nav-run-btn'   },
  { page: 'team',         label: 'Team'             },
]

const TEAM = [
  { name: 'Tamilselvan',   role: 'Overall Architecture · AI & Agentic Design · Orchestration', tag: 'LangGraph · Claude API · FastAPI',  icon: '🤖' },
  { name: 'Suresh',        role: 'Frontend & UI/UX · Jira Integration',                        tag: 'React 19 · TypeScript · Jira API',  icon: '🖥️' },
  { name: 'Bhagvan (MTA)', role: 'Backend Spring Boot Services',                               tag: 'Spring Boot · Java 21',             icon: '☕' },
  { name: 'Hemant (MTA)',  role: 'FastAPI Python Services',                                    tag: 'FastAPI · Python 3.11',             icon: '🐍' },
]

const PROVIDER_ICONS: Record<string, string> = {
  claude:  '✦',
  litellm: '⚡',
}

function LlmProviderBar() {
  const [config, setConfig] = useState<LlmConfig | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    getLlmConfig().then(setConfig)
  }, [])

  const select = async (id: string) => {
    if (!config || switching || config.active === id) return
    setSwitching(true)
    try {
      await setLlmProvider(id)
      setConfig(prev => prev ? { ...prev, active: id } : prev)
    } finally {
      setSwitching(false)
    }
  }

  if (!config) return null

  return (
    <div className="llm-provider-bar">
      {config.providers.filter(p => p.id !== 'claude').map(p => {
        const isActive = config.active === p.id
        return (
          <button
            key={p.id}
            className={[
              'llm-provider-btn',
              isActive ? 'llm-provider-btn--active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => select(p.id)}
            disabled={switching}
            title={p.available ? p.description : `${p.description} — not configured`}
          >
            <span className="llm-provider-icon">{PROVIDER_ICONS[p.id] ?? '◈'}</span>
            <span className="llm-provider-label">{p.label}</span>
            <span className={`llm-provider-tag llm-provider-tag--${p.id}`}>
              {p.description}
            </span>
          </button>
        )
      })}
      <span className="llm-provider-model" title="Active model">{config.model}</span>
    </div>
  )
}

function DisclaimerBanner({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <div className="disclaimer-banner">
      <span className="disclaimer-banner-icon">⚠</span>
      <span>
        No Marriott production or non-production data, systems, services, microservices, or source code
        are used in this product. This is an independent Marriott Codefest 4.0 prototype built solely for demonstration purposes —{' '}
        <button className="disclaimer-banner-link" onClick={() => onNav('disclaimer')}>Disclaimer</button>
      </span>
    </div>
  )
}

function AppHeader({ page, onNav, model }: { page: Page; onNav: (p: Page) => void; model?: string }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <button className="logo-badge" onClick={() => onNav('home')}>
            <img src="/favicon.svg" className="logo-badge-icon" alt="" />
            AURA
          </button>
          {model && (
            <div className="header-model-badge">
              <span className="header-model-icon">⚡</span>
              <span className="header-model-label">LiteLLM</span>
              <span className="header-model-label">model:</span>
              <span className="header-model-name">{model}</span>
            </div>
          )}
        </div>
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
          <span className="aura-text">AURA</span>
        </h1>
        <p className="hero-full-name">
          <span className="hero-full-aura">Autonomous Unified Resolution Agent</span>
        </p>
        <p className="hero-description">
          A multi-agent AI framework that handles production support tasks. By deploying specialized
          LLM-powered agents — from service desk analysts, domain and system experts — which evaluates
          production problems and provides solutions. These agents engage in dynamic discussions and
          decision making to pinpoint the optimal strategy to resolve issues quickly.
        </p>
        <button className="hero-cta" onClick={onRunAgent}>
          ▶ Run AURA Agents
        </button>
      </section>
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
  const [llmConfig, setLlmConfig]         = useState<LlmConfig | null>(null)

  useEffect(() => { getLlmConfig().then(setLlmConfig) }, [])

  const openRun = (runId?: string) => {
    setSelectedRunId(runId)
    setPage('run')
  }

  const goHome = () => setPage('home')

  /* ── All pages share the persistent app shell nav ── */
  return (
    <div className="app">
      <AppHeader page={page} onNav={(p) => p === 'run' ? openRun() : setPage(p)} model={llmConfig?.model} />
      <main className={`main-content${(page === 'framework' || page === 'architecture') ? ' main-content--wide' : ''}`}>
        {page === 'home'         && <HomePage onRunAgent={() => openRun()} />}
        {page === 'ecosystem'    && <EcosystemPage />}
        {page === 'framework'    && <FrameworkPage />}
        {page === 'architecture' && <ArchitecturePage />}
        {page === 'usecases'     && <div className="page-content" key="usecases"><UseCases /></div>}
        {page === 'team'         && <TeamPage />}
        {page === 'jira'         && <JiraIssues onRunAgent={(runId) => openRun(runId)} />}
        {page === 'disclaimer'   && <DisclaimerPage />}
        {page === 'status'       && <TicketStatus onViewRun={(runId) => openRun(runId)} onBack={goHome} />}
        {page === 'run'          && <AgentRun initialRunId={selectedRunId} onBack={goHome} onJira={() => setPage('jira')} onStatus={() => setPage('status')} />}
      </main>
      <DisclaimerBanner onNav={setPage} />
    </div>
  )
}

export default App
