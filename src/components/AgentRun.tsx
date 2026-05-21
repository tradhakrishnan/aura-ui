import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  submitTicket,
  getRun,
  listRuns,
  approveRun,
  rejectRun,
  retryRun,
  parseTicket,
  getRunPrompts,
  type TicketPayload,
  type RunData,
  type RunSummary,
  type AgentMessage,
  type PromptEntry,
} from '../api/agentApi'
import './AgentRun.css'

/* ── Agent section metadata ─────────────────────────────────────────────── */
function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const SECTIONS = [
  { key: 'sda_open',   label: 'Service Desk Analyst',    tag: 'SDA',  icon: 'SDA',  iconMod: 'sda'  },
  { key: 'spa',        label: 'System & Process Analyst', tag: 'SPA',  icon: 'SPA',  iconMod: 'spa'  },
  { key: 'sme',        label: 'Subject Matter Expert',    tag: 'SME',  icon: 'SME',  iconMod: 'sme'  },
  { key: 'rat',        label: 'Risk Assessment Team',     tag: 'RAT',  icon: 'RAT',  iconMod: 'rat'  },
  { key: 'authorizer', label: 'Authorizer',               tag: 'AUTH', icon: 'AUTH', iconMod: 'auth' },
  { key: 'ea',         label: 'Execution Agent',          tag: 'EA',   icon: 'EA',   iconMod: 'ea'   },
  { key: 'va',         label: 'Validation Agent',         tag: 'VA',   icon: 'VA',   iconMod: 'va'   },
  { key: 'sda_close',  label: 'Service Desk Analyst (Close)', tag: 'SDA', icon: 'SDA', iconMod: 'sda' },
]

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

const BLANK_FORM: TicketPayload = {
  ticket_id: '',
  source: 'Manual',
  title: '',
  description: '',
  severity: 'High',
  affected_system: '',
  affected_hotel: '',
  affected_location: '',
  affected_eid: '',
  reported_by: '',
}

const DEMO_TICKETS: { label: string; form: TicketPayload }[] = [
  {
    label: 'Hotel missing from location',
    form: {
      ticket_id: `INC${Math.floor(100000 + Math.random() * 900000)}`,
      source: 'Manual',
      title: 'Hotel code PARBA missing for the control location QCMG1G',
      description:
        'Hotel PARBA is expected to be listed under control location QCMG1G but is not present in the controlled hotels array. ' +
        'This is causing downstream assignment failures for properties in that region.',
      severity: 'High',
      affected_system: 'TAP',
      affected_hotel: 'PARBA',
      affected_location: 'QCMG1G',
      affected_eid: '',
      reported_by: 'ops-team',
    },
  },
  {
    label: 'User EID missing app assignment',
    form: {
      ticket_id: `INC${Math.floor(100000 + Math.random() * 900000)}`,
      source: 'Manual',
      title: 'User GPBGY085 missing MARSHA app assignment',
      description:
        'User GPBGY085 does not have an active MARSHA application assignment. ' +
        'They are unable to log into the reservation system and impacting check-in operations at 3 properties.',
      severity: 'Critical',
      affected_system: 'MARSHA',
      affected_hotel: '',
      affected_location: '',
      affected_eid: 'GPBGY085',
      reported_by: 'helpdesk',
    },
  },
  {
    label: 'Inactive hotel blocking sync',
    form: {
      ticket_id: `INC${Math.floor(100000 + Math.random() * 900000)}`,
      source: 'Manual',
      title: 'Inactive hotel XZADS blocking TAP location sync',
      description:
        'Hotel XZADS has status Inactive in TAP but is still referenced in the ACRS assignment feed. ' +
        'This is causing sync errors and preventing nightly reconciliation from completing.',
      severity: 'Medium',
      affected_system: 'ACRS',
      affected_hotel: 'XZADS',
      affected_location: '',
      affected_eid: '',
      reported_by: 'integration-team',
    },
  },
]

/* ── Agent call context (what the agent receives as input) ──────────────── */
function AgentCallContext({ section, runData }: { section: typeof SECTIONS[0]; runData: RunData | null }) {
  const ticket = runData?.ticket

  if (section.key === 'sda_open') {
    return (
      <pre className="ar-call-json">{JSON.stringify({
        ticket_id:       ticket?.ticket_id   ?? '—',
        title:           ticket?.title       ?? '—',
        severity:        ticket?.severity    ?? '—',
        affected_system: ticket?.affected_system || undefined,
        affected_hotel:  ticket?.affected_hotel  || undefined,
        affected_eid:    ticket?.affected_eid    || undefined,
        source:          ticket?.source      ?? '—',
      }, null, 2)}</pre>
    )
  }
  if (section.key === 'spa') {
    return <p className="ar-call-desc">Performing root cause analysis using the SDA problem framing as context.</p>
  }
  if (section.key === 'sme') {
    return <p className="ar-call-desc">Evaluating domain expertise and cross-referencing known system patterns with SPA findings.</p>
  }
  if (section.key === 'rat') {
    const snippet = runData?.spa_findings?.slice(0, 100)
    return (
      <p className="ar-call-desc">
        Assessing risk level from SPA + SME analysis.
        {snippet ? <> Context: <em>{snippet}…</em></> : null}
      </p>
    )
  }
  if (section.key === 'authorizer') {
    return (
      <p className="ar-call-desc">
        Risk classification: <strong style={{ color: '#d29922' }}>{runData?.risk_level ?? 'Evaluating…'}</strong> — awaiting human authorization decision.
      </p>
    )
  }
  if (section.key === 'ea') {
    return (
      <p className="ar-call-desc">
        Executing approved resolution plan for{' '}
        <strong>{ticket?.affected_system || 'affected system'}</strong>.
      </p>
    )
  }
  if (section.key === 'va') {
    return <p className="ar-call-desc">Running 3 post-fix health checks to validate the resolution.</p>
  }
  if (section.key === 'sda_close') {
    return <p className="ar-call-desc">Compiling resolution summary and auto-closing the ticket.</p>
  }
  return null
}

/* ── Agent result content ────────────────────────────────────────────────── */
function AgentResultContent({ section, runData, onOverride, onReject }: { section: typeof SECTIONS[0]; runData: RunData; onOverride?: () => void; onReject?: () => void }) {
  const messages: AgentMessage[] = (runData.agent_conversation ?? []).filter(
    (m) => m.node === section.key,
  )

  if (section.key === 'rat' && runData.risk_level) {
    const level = runData.risk_level.toLowerCase()
    const mod = level.includes('immediate') ? 'immediate' : level.includes('escalat') ? 'escalated' : 'normal'
    return (
      <div>
        <div className={`ar-risk-badge ar-risk-badge--${mod}`}>
          {mod === 'immediate' ? '⚠' : mod === 'escalated' ? '↑' : '✓'} {runData.risk_level}
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{runData.spa_findings || ''}</ReactMarkdown>
        {messages.map((m, i) => (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
        ))}
      </div>
    )
  }

  if (section.key === 'authorizer') {
    const pending  = runData.pending_approval
    const approved = runData.authorized
    const rejected = !approved && !pending && runData.status === 'completed'
    return (
      <div>
        {pending && (
          <div className="ar-auth-badge" style={{ background: 'rgba(210,153,34,0.2)', color: '#d29922', border: '1px solid rgba(210,153,34,0.4)' }}>
            ⏳ Awaiting Your Approval
          </div>
        )}
        {approved && <div className="ar-auth-badge ar-auth-badge--yes">✓ Approved by Human</div>}
        {rejected && <div className="ar-auth-badge ar-auth-badge--no">✗ Rejected</div>}
        {messages.map((m, i) => (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
        ))}
        {pending && onOverride && onReject && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="ar-btn ar-btn-primary" onClick={onOverride} style={{ background: '#238636', borderColor: '#2ea043' }}>
              ✓ Approve &amp; Execute
            </button>
            <button className="ar-btn" onClick={onReject} style={{ borderColor: '#da3633', color: '#f85149' }}>
              ✗ Reject
            </button>
            <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>AI recommends — you decide</span>
          </div>
        )}
        {rejected && onOverride && !approved && (
          <div style={{ marginTop: 16 }}>
            <button className="ar-btn ar-btn-primary" onClick={onOverride} style={{ background: '#9333ea', borderColor: '#a855f7' }}>
              ⚡ Override &amp; Approve
            </button>
          </div>
        )}
      </div>
    )
  }

  if (section.key === 'va' && runData.validation_report) {
    const vr = runData.validation_report
    return (
      <div>
        {vr.status && (
          <div className={`ar-risk-badge ar-risk-badge--${vr.status === 'VALIDATED' ? 'normal' : 'immediate'}`}>
            {vr.status === 'VALIDATED' ? '✓ Validation Passed' : '✗ Validation Failed'}
          </div>
        )}
        {vr.details && <ReactMarkdown remarkPlugins={[remarkGfm]}>{vr.details}</ReactMarkdown>}
        {messages.map((m, i) => (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return <p style={{ color: '#8b949e', fontStyle: 'italic' }}>No output captured.</p>
  }

  return (
    <>
      {messages.map((m, i) => (
        <div key={i}>
          {m.agent && <p style={{ fontSize: '0.72rem', color: '#8b949e', marginBottom: 4 }}>{m.agent}</p>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
        </div>
      ))}
    </>
  )
}

/* ── Prompt history panel ────────────────────────────────────────────────── */
function agentLabel(systemPrompt: string): string {
  const m = systemPrompt.match(/You are Agent \d+ - ([^\n(]+)/)
  return m ? m[1].trim() : 'Agent'
}

const ROLE_META: Record<string, { label: string; cls: string }> = {
  system:  { label: 'SYSTEM',   cls: 'ph-role--system'  },
  human:   { label: 'PROMPT',   cls: 'ph-role--human'   },
  ai:      { label: 'AI',       cls: 'ph-role--ai'      },
  tool:    { label: 'TOOL',     cls: 'ph-role--tool'    },
  unknown: { label: '?',        cls: 'ph-role--unknown' },
}

function PromptHistoryPanel({ runId, onClose }: { runId: string; onClose: () => void }) {
  const [entries, setEntries] = useState<PromptEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [openIdx, setOpenIdx] = useState<Set<number>>(new Set([0]))

  const load = () => {
    setLoading(true)
    setError(null)
    getRunPrompts(runId)
      .then((d) => { setEntries(d.prompt_history); setLoading(false) })
      .catch((e) => { setError(String(e)); setLoading(false) })
  }

  useEffect(() => { load() }, [runId])

  return (
    <div className="ph-overlay" onClick={onClose}>
      <div className="ph-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ph-panel-header">
          <div>
            <div className="ph-panel-title">LLM Prompt History</div>
            <div className="ph-panel-sub">{loading ? 'Loading…' : `${entries.length} agent invocation${entries.length !== 1 ? 's' : ''}`}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ph-close" onClick={load} title="Refresh">↻</button>
            <button className="ph-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {loading && <div className="ph-loading">Loading…</div>}

        {!loading && error && (
          <div className="ph-empty" style={{ color: '#f85149' }}>
            Failed to load: {error}
            <br /><button className="ts-link" onClick={load} style={{ marginTop: 8 }}>Retry</button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="ph-empty">No prompt history stored yet. History is captured as each agent runs.</div>
        )}

        <div className="ph-entries">
          {entries.map((entry, i) => {
            const isOpen = openIdx.has(i)
            const label  = agentLabel(entry.system_prompt)
            const time   = entry.captured_at ? new Date(entry.captured_at).toLocaleTimeString() : ''
            const aiMsgs = entry.messages.filter((m) => m.role === 'ai').length
            const toolMsgs = entry.messages.filter((m) => m.role === 'tool').length
            return (
              <div key={i} className="ph-entry">
                <div className="ph-entry-header" onClick={() => {
                  setOpenIdx((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
                }}>
                  <div className="ph-entry-num">{i + 1}</div>
                  <div className="ph-entry-meta">
                    <span className="ph-entry-agent">{label}</span>
                    <span className="ph-entry-stats">{entry.messages.length} msgs · {aiMsgs} AI · {toolMsgs} tool calls</span>
                  </div>
                  <span className="ph-entry-time">{time}</span>
                  <svg className={`ph-chevron${isOpen ? ' ph-chevron--open' : ''}`} viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {isOpen && (
                  <div className="ph-messages">
                    {entry.messages.map((msg, j) => {
                      const meta = ROLE_META[msg.role] ?? ROLE_META.unknown
                      return (
                        <div key={j} className={`ph-msg ph-msg--${msg.role}`}>
                          <span className={`ph-role ${meta.cls}`}>{meta.label}</span>
                          <div className="ph-msg-body">
                            {msg.tool_calls && msg.tool_calls.length > 0 && (
                              <div className="ph-tool-calls">
                                {msg.tool_calls.map((tc, k) => (
                                  <div key={k} className="ph-tool-call">
                                    <span className="ph-tool-name">⚙ {tc.name}</span>
                                    <pre className="ph-tool-args">{JSON.stringify(tc.args, null, 2)}</pre>
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.content && (
                              <pre className="ph-msg-content">{msg.content}</pre>
                            )}
                            {msg.tool_call_id && (
                              <span className="ph-tool-id">id: {msg.tool_call_id.slice(0, 12)}…</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface AgentRunProps {
  initialRunId?: string
  onBack?: () => void
  onJira?: () => void
  onStatus?: () => void
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AgentRun({ initialRunId, onBack, onJira, onStatus }: AgentRunProps) {
  const [view, setView] = useState<'pick' | 'form' | 'prompt' | 'running'>(initialRunId ? 'running' : 'pick')
  const [form, setForm] = useState<TicketPayload>(BLANK_FORM)
  const [submitting, setSubmitting] = useState(false)
  // Prompt mode state
  const [promptText, setPromptText]   = useState('')
  const [promptPhase, setPromptPhase] = useState<'input' | 'analyzing' | 'preview'>('input')
  const [parsedForm, setParsedForm]   = useState<TicketPayload | null>(null)
  const [parseError, setParseError]   = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [runData, setRunData] = useState<RunData | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<RunSummary[]>([])
  const [overriding, setOverriding] = useState(false)
  const [rejecting, setRejecting]   = useState(false)
  const [retrying, setRetrying]     = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadHistory = () => listRuns().then((data) => {
    const latest = new Map<string, RunSummary>()
    for (const r of data) {
      const key = r.jira_issue_key || r.ticket_id
      const existing = latest.get(key)
      if (!existing || r.started_at > existing.started_at) latest.set(key, r)
    }
    setHistory([...latest.values()])
  }).catch(() => {})

  /* Reset collapsed state whenever run changes — all sections start expanded */
  useEffect(() => {
    setCollapsedSections(new Set())
  }, [runId])

  /* Load history on mount; pre-load run if initialRunId provided */
  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (initialRunId) {
      getRun(initialRunId).then((data) => {
        setRunId(initialRunId)
        setRunData(data)
        setView('running')
      }).catch(() => {})
    }
  }, [initialRunId])

  /* Prompt mode — analyze free text and extract ticket fields */
  const handleAnalyze = useCallback(async (text: string) => {
    if (!text.trim()) return
    setPromptPhase('analyzing')
    setParseError(null)
    try {
      const ticket = await parseTicket(text.trim())
      setParsedForm(ticket)
      setPromptPhase('preview')
    } catch {
      setParseError('Could not extract fields. You can still edit and run manually.')
      setPromptPhase('input')
    }
  }, [])

  /* Poll while running */
  useEffect(() => {
    if (!runId) return
    const poll = async () => {
      try {
        const data = await getRun(runId)
        setRunData(data)
        if (data.status !== 'running') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          loadHistory()
        }
      } catch {/* ignore transient errors */}
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [runId])

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ticket_id || !form.title || !form.description) return
    setSubmitting(true)
    setRunData(null)
    try {
      const { run_id } = await submitTicket(form)
      setRunId(run_id)
      setView('running')
    } catch (err) {
      alert(`Submit failed: ${err}`)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Load historical run ─────────────────────────────────────────────────── */
  const loadRun = async (rid: string) => {
    try {
      const data = await getRun(rid)
      setRunId(rid)
      setRunData(data)
      setView('running')
      setShowHistory(false)
      if (data.status === 'running') {
        // start polling
        setRunId(rid)
      }
    } catch {/* ignore */}
  }

  /* ── Override approval ───────────────────────────────────────────────────── */
  const handleOverride = async () => {
    if (!runId || overriding) return
    setOverriding(true)
    try {
      await approveRun(runId)
      setRunData((prev) => prev ? { ...prev, authorized: true, status: 'running' } : prev)
      // restart polling
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const data = await getRun(runId)
          setRunData(data)
          if (data.status !== 'running') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            loadHistory()
            setOverriding(false)
          }
        } catch {/* ignore */}
      }, 2000)
    } catch (err) {
      alert(`Override failed: ${err}`)
      setOverriding(false)
    }
  }

  /* ── Reject ──────────────────────────────────────────────────────────────── */
  const handleReject = async () => {
    if (!runId || rejecting) return
    setRejecting(true)
    try {
      await rejectRun(runId)
      setRunData((prev) => prev ? { ...prev, rejected: true, pending_approval: false, ticket_status: 'Rejected', status: 'completed' } : prev)
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      loadHistory()
    } catch (err) {
      alert(`Reject failed: ${err}`)
    } finally {
      setRejecting(false)
    }
  }

  /* ── Retry failed run ───────────────────────────────────────────────────── */
  const handleRetry = async () => {
    if (!runId || retrying) return
    setRetrying(true)
    try {
      const { run_id } = await retryRun(runId)
      setRunId(run_id)
      setRunData(null)
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const data = await getRun(run_id)
          setRunData(data)
          if (data.status !== 'running') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            loadHistory()
            setRetrying(false)
          }
        } catch {/* ignore */}
      }, 2000)
    } catch (err) {
      alert(`Retry failed: ${err}`)
      setRetrying(false)
    }
  }

  /* ── Toggle section ──────────────────────────────────────────────────────── */
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  const sectionStatus = (key: string) => {
    if (!runData) return 'pending'
    if (runData.agents_completed?.includes(key)) return 'done'
    if (runData.status === 'running' && runData.agents_completed) {
      const idx = SECTIONS.findIndex((s) => s.key === key)
      const lastDone = SECTIONS.map((s) => s.key).lastIndexOf(
        runData.agents_completed[runData.agents_completed.length - 1]
      )
      if (idx === lastDone + 1) return 'working'
    }
    return 'pending'
  }

  const bannerMod = () => {
    if (!runData) return 'open'
    if (runData.rejected) return 'failed'
    const ts = runData.ticket_status?.toLowerCase() ?? ''
    if (ts.includes('close') || ts.includes('resolv')) return 'closed'
    if (runData.pending_approval) return 'progress'
    if (runData.status === 'running') return 'progress'
    if (runData.status === 'failed') return 'failed'
    return 'open'
  }

  const statusLabel = () => {
    if (!runData) return 'OPEN'
    if (runData.rejected) return 'REJECTED'
    if (runData.status === 'failed') return 'FAILED'
    if (runData.pending_approval) return 'AWAITING APPROVAL'
    return (runData.ticket_status ?? 'OPEN').toUpperCase()
  }

  /* ── Shared action bar (pick / form / prompt) — nav handled by AppHeader ── */
  const sharedHeader = (
    <div className="ar-action-bar">
      <button className="ar-btn" onClick={() => setShowHistory(!showHistory)}>
        History
        {history.length > 0 && <span className="ar-history-badge">{history.length}</span>}
      </button>
    </div>
  )

  /* ── Pick view — choose Manual vs Prompt ───────────────────────────────── */
  if (view === 'pick') {
    return (
      <div className="ar-page">
        {sharedHeader}
        {showHistory && (
          <div className="ar-history-panel">
            <div className="ar-history-title">Recent Runs</div>
            {history.map((r) => (
              <div key={r.run_id} className="ar-history-item" onClick={() => loadRun(r.run_id)}>
                <div className="ar-history-item-id">
                  <span className={`ar-status-dot ar-status-dot--${r.status === 'completed' ? 'completed' : r.status === 'running' ? 'running' : 'failed'}`} />
                  {r.ticket_id}
                </div>
                <div className="ar-history-item-meta">{r.run_id.slice(0, 12)}… · {r.started_at?.slice(0, 16).replace('T', ' ')}</div>
              </div>
            ))}
            {history.length === 0 && <p style={{ fontSize: '0.8rem', color: '#8b949e' }}>No runs yet.</p>}
          </div>
        )}
        <div className="ar-pick-wrap">
          <div className="ar-pick-eyebrow">Select Mode</div>
          <h2 className="ar-pick-title">How would you like to run AURA?</h2>
          <p className="ar-pick-sub">Choose how you want to submit a support ticket to the agent pipeline.</p>
          <div className="ar-pick-cards">

            {/* Manual card */}
            <div className="ar-pick-card" onClick={() => setView('form')}>
              <div className="ar-pick-card-icon">📋</div>
              <div className="ar-pick-card-name">Manual Form</div>
              <div className="ar-pick-card-desc">
                Fill out the structured ticket form — specify ticket ID, severity, affected system, and all relevant fields.
              </div>
              <div className="ar-pick-card-tags">
                <span className="ar-pick-tag">Full control</span>
                <span className="ar-pick-tag">All fields</span>
              </div>
              <button className="ar-pick-btn" onClick={(e) => { e.stopPropagation(); setView('form') }}>
                Run Agent — Manual
              </button>
            </div>

            {/* Prompt card */}
            <div className="ar-pick-card ar-pick-card--prompt" onClick={() => setView('prompt')}>
              <div className="ar-pick-card-icon">💬</div>
              <div className="ar-pick-card-name">Prompt Mode</div>
              <div className="ar-pick-card-desc">
                Describe the production issue in plain language. AURA's AI will extract the ticket details and run the pipeline automatically.
              </div>
              <div className="ar-pick-card-tags">
                <span className="ar-pick-tag ar-pick-tag--ai">AI-powered</span>
                <span className="ar-pick-tag ar-pick-tag--ai">Natural language</span>
              </div>
              <button className="ar-pick-btn ar-pick-btn--prompt" onClick={(e) => { e.stopPropagation(); setView('prompt') }}>
                Run Agent — Prompt
              </button>
            </div>

            {/* Jira card */}
            <div className="ar-pick-card ar-pick-card--jira" onClick={() => onJira?.()}>
              <div className="ar-pick-card-icon">🔗</div>
              <div className="ar-pick-card-name">Jira Issues</div>
              <div className="ar-pick-card-desc">
                Browse open Jira issues from your project and run AURA directly on any ticket with one click.
              </div>
              <div className="ar-pick-card-tags">
                <span className="ar-pick-tag ar-pick-tag--jira">Open issues</span>
                <span className="ar-pick-tag ar-pick-tag--jira">One-click run</span>
              </div>
              <button className="ar-pick-btn ar-pick-btn--jira" onClick={(e) => { e.stopPropagation(); onJira?.() }}>
                View Jira Issues
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  /* ── Prompt view — describe issue in plain language ─────────────────────── */
  if (view === 'prompt') {
    const PROMPT_DEMOS = [
      { label: 'Hotel missing from location', text: 'Hotel code PARBA is expected to be listed under control location QCMG1G but is not present in the controlled hotels array. This is causing downstream assignment failures for properties in that region.' },
      { label: 'User EID missing app assignment', text: 'User GPBGY085 does not have an active MARSHA application assignment. They are unable to log into the reservation system and impacting check-in operations at 3 properties.' },
      { label: 'Inactive hotel blocking sync', text: 'Hotel SUXAK is marked as inactive in ACRS but still appearing in the MINT sync queue causing repeated sync failures for the last 6 hours.' },
    ]
    return (
      <div className="ar-page">
        {sharedHeader}
        <div className="ar-prompt-wrap">
          <button className="ar-prompt-back" onClick={() => { setView('pick'); setPromptPhase('input'); setParseError(null) }}>
            ← Back
          </button>

          <div className="ar-prompt-header">
            <div className="ar-prompt-icon">💬</div>
            <div>
              <h2 className="ar-prompt-title">Describe Your Issue</h2>
              <p className="ar-prompt-sub">AURA will extract ticket fields using AI and run the 8-agent pipeline.</p>
            </div>
          </div>

          {/* Demo quick-fills */}
          {promptPhase === 'input' && (
            <div className="ar-demo-row" style={{ marginBottom: '16px' }}>
              <span className="ar-demo-label">Demo scenarios:</span>
              {PROMPT_DEMOS.map((d) => (
                <button key={d.label} type="button" className="ar-demo-btn"
                  onClick={() => setPromptText(d.text)}>
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Input phase */}
          {promptPhase === 'input' && (
            <div className="ar-prompt-input-wrap">
              <textarea
                className="ar-prompt-textarea"
                placeholder="Describe the production issue in plain language…&#10;&#10;e.g. User WITSF960 is missing ACRS permission 'Revenue Manager' and cannot access the revenue dashboard since this morning."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={7}
              />
              {parseError && <div className="ar-prompt-error">{parseError}</div>}
              <div className="ar-prompt-actions">
                <span className="ar-prompt-hint">{promptText.length}/1000 characters</span>
                <button
                  className="ar-prompt-run-btn"
                  disabled={!promptText.trim()}
                  onClick={() => handleAnalyze(promptText)}
                >
                  Analyze &amp; Run →
                </button>
              </div>
            </div>
          )}

          {/* Analyzing phase */}
          {promptPhase === 'analyzing' && (
            <div className="ar-prompt-analyzing">
              <div className="ar-dots">
                <div className="ar-dot" /><div className="ar-dot" /><div className="ar-dot" />
              </div>
              <div className="ar-prompt-analyzing-label">Analyzing your request…</div>
              <div className="ar-prompt-analyzing-sub">Extracting ticket fields with AI</div>
            </div>
          )}

          {/* Preview phase */}
          {promptPhase === 'preview' && parsedForm && (
            <div className="ar-prompt-preview">
              <div className="ar-prompt-preview-header">
                <span className="ar-prompt-preview-check">✓</span>
                <span className="ar-prompt-preview-title">Fields Extracted</span>
              </div>
              <div className="ar-prompt-preview-grid">
                {[
                  { label: 'Ticket ID',  value: parsedForm.ticket_id },
                  { label: 'Title',      value: parsedForm.title },
                  { label: 'Severity',   value: parsedForm.severity },
                  { label: 'System',     value: parsedForm.affected_system || '—' },
                  { label: 'Hotel',      value: parsedForm.affected_hotel || '—' },
                  { label: 'Location',   value: parsedForm.affected_location || '—' },
                  { label: 'EID',        value: parsedForm.affected_eid || '—' },
                  { label: 'Reported by',value: parsedForm.reported_by || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="ar-prompt-preview-row">
                    <span className="ar-prompt-preview-lbl">{label}</span>
                    <span className="ar-prompt-preview-val">{value}</span>
                  </div>
                ))}
              </div>
              <div className="ar-prompt-preview-actions">
                <button className="ar-btn" onClick={() => {
                  setForm(parsedForm)
                  setView('form')
                }}>
                  ✏ Edit Fields
                </button>
                <button className="ar-prompt-confirm-btn" onClick={async () => {
                  setSubmitting(true)
                  try {
                    const { run_id } = await submitTicket(parsedForm)
                    setRunId(run_id)
                    setView('running')
                    const data = await getRun(run_id)
                    setRunData(data)
                  } catch { /* ignore */ } finally {
                    setSubmitting(false)
                  }
                }} disabled={submitting}>
                  {submitting ? 'Starting…' : '▶ Confirm & Run'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  /* ── Form view ───────────────────────────────────────────────────────────── */
  if (view === 'form') {
    return (
      <div className="ar-page">
        {sharedHeader}
        {showHistory && (
          <div className="ar-history-panel">
            <div className="ar-history-title">Recent Runs</div>
            {history.map((r) => (
              <div key={r.run_id} className="ar-history-item" onClick={() => loadRun(r.run_id)}>
                <div className="ar-history-item-id">
                  <span className={`ar-status-dot ar-status-dot--${r.status === 'completed' ? 'completed' : r.status === 'running' ? 'running' : 'failed'}`} />
                  {r.ticket_id}
                </div>
                <div className="ar-history-item-meta">{r.run_id.slice(0, 12)}… · {r.started_at?.slice(0, 16).replace('T', ' ')}</div>
              </div>
            ))}
            {history.length === 0 && <p style={{ fontSize: '0.8rem', color: '#8b949e' }}>No runs yet.</p>}
          </div>
        )}

        {/* Form */}
        <div className="ar-form-wrap">
          <button className="ar-prompt-back" onClick={() => setView('pick')}>← Options</button>
          <div className="ar-form-title">Submit a Support Ticket</div>
          <div className="ar-form-desc">
            AURA's 7-agent pipeline will automatically diagnose, escalate, execute, and validate — then close the ticket.
          </div>

          {/* Demo presets */}
          <div className="ar-demo-row">
            <span className="ar-demo-label">Demo scenarios:</span>
            {DEMO_TICKETS.map((d) => (
              <button
                key={d.label}
                type="button"
                className="ar-demo-btn"
                onClick={() => setForm({ ...d.form, ticket_id: `INC${Math.floor(100000 + Math.random() * 900000)}` })}
              >
                {d.label}
              </button>
            ))}
          </div>

          <form className="ar-form" onSubmit={handleSubmit}>
            <div className="ar-form-row">
              <div className="ar-field">
                <label>Ticket ID *</label>
                <input
                  value={form.ticket_id}
                  onChange={(e) => setForm({ ...form, ticket_id: e.target.value })}
                  placeholder="INC0012345"
                  required
                />
              </div>
              <div className="ar-field">
                <label>Severity *</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITY_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="ar-field">
              <label>Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short description of the issue"
                required
              />
            </div>

            <div className="ar-field">
              <label>Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description of the production issue..."
                required
              />
            </div>

            <div className="ar-form-row">
              <div className="ar-field">
                <label>Affected System</label>
                <input
                  value={form.affected_system ?? ''}
                  onChange={(e) => setForm({ ...form, affected_system: e.target.value })}
                  placeholder="e.g. payment-gateway-svc"
                />
              </div>
              <div className="ar-field">
                <label>Affected Hotel</label>
                <input
                  value={form.affected_hotel ?? ''}
                  onChange={(e) => setForm({ ...form, affected_hotel: e.target.value })}
                  placeholder="e.g. WDC001"
                />
              </div>
            </div>

            <div className="ar-form-row">
              <div className="ar-field">
                <label>Affected Location</label>
                <input
                  value={form.affected_location ?? ''}
                  onChange={(e) => setForm({ ...form, affected_location: e.target.value })}
                  placeholder="e.g. LOC-US-001"
                />
              </div>
              <div className="ar-field">
                <label>Affected EID</label>
                <input
                  value={form.affected_eid ?? ''}
                  onChange={(e) => setForm({ ...form, affected_eid: e.target.value })}
                  placeholder="e.g. GPBGY085"
                />
              </div>
            </div>

            <div className="ar-field">
              <label>Reported By</label>
              <input
                value={form.reported_by ?? ''}
                onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
                placeholder="Name or EID of reporter"
              />
            </div>

            <div className="ar-form-actions">
              <button className="ar-btn ar-btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : '▶ Run AURA Agents'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  /* ── Running / result view ───────────────────────────────────────────────── */
  const bMod = bannerMod()
  const completedCount = runData?.agents_completed?.length ?? 0
  const totalAgents = SECTIONS.length

  return (
    <div className="ar-page">
      {/* Action bar — nav handled by AppHeader */}
      <div className="ar-action-bar">
        <button className="ar-btn" onClick={() => { setView('pick'); setRunData(null); setRunId(null); setForm(BLANK_FORM); setPromptText(''); setPromptPhase('input') }}>
          + New Ticket
        </button>
        <button className="ar-btn" onClick={() => setShowHistory(!showHistory)}>
          History
          {history.length > 0 && <span className="ar-history-badge">{history.length}</span>}
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="ar-history-panel">
          <div className="ar-history-title">Recent Runs</div>
          {history.map((r) => (
            <div key={r.run_id} className="ar-history-item" onClick={() => loadRun(r.run_id)}>
              <div className="ar-history-item-id">
                <span className={`ar-status-dot ar-status-dot--${r.status === 'completed' ? 'completed' : r.status === 'running' ? 'running' : 'failed'}`} />
                {r.ticket_id}
              </div>
              <div className="ar-history-item-meta">{r.run_id.slice(0, 12)}… · {r.started_at?.slice(0, 16).replace('T', ' ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket chip bar */}
      {runData && (
        <div className="ar-chip-bar">
          <div className="ar-chip">
            <span className="ar-chip-dot" />
            {runData.ticket_id}
          </div>
          {runData.jira_browse_url && (
            <a
              className="ar-jira-badge"
              href={runData.jira_browse_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="ar-jira-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 18.298 18.3V6.762a1.005 1.005 0 0 0-1.004-1.005zm5.701-5.757H11.48a5.215 5.215 0 0 0 5.215 5.215h2.13v2.04A5.215 5.215 0 0 0 24 12.47V1.005A1.005 1.005 0 0 0 22.995 0z" />
              </svg>
              {runData.jira_issue_key || 'Jira'}
            </a>
          )}
          <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>
            {runData.ticket?.title ?? ''}
          </span>
        </div>
      )}

      {/* Status banner */}
      {runData && (
        <div className={`ar-banner ar-banner--${bMod}`}>
          <div>
            <div className="ar-banner-label">Ticket Status</div>
            <div className="ar-banner-status">{statusLabel()}</div>
          </div>
          <div className="ar-banner-meta">
            <strong>{completedCount}/{totalAgents} agents</strong>
            {runData.started_at && <span>{runData.started_at.slice(0, 16).replace('T', ' ')} UTC</span>}
            {runData.total_tokens && runData.total_tokens.total > 0 && (
              <span className="ar-total-tokens">{formatTokens(runData.total_tokens.total)} tokens total</span>
            )}
            {runData.status === 'failed' && !runData.rejected && (
              <button
                className="ar-retry-btn"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? '↻ Retrying…' : '↻ Retry'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Animated progress indicator */}
      {runData?.status === 'running' && (
        <div className="ar-progress">
          <div className="ar-dots">
            <div className="ar-dot" />
            <div className="ar-dot" />
            <div className="ar-dot" />
          </div>
          Agents working… ({completedCount}/{totalAgents} complete)
        </div>
      )}

      {/* Pipeline header with collapse toggle */}
      {runData && (
        <div className="ar-pipeline-header">
          <span className="ar-pipeline-label">Agent Pipeline</span>
          <button
            className="ar-collapse-btn"
            onClick={() => {
              const allKeys = SECTIONS.map(s => s.key)
              const allCollapsed = allKeys.every(k => collapsedSections.has(k))
              setCollapsedSections(allCollapsed ? new Set() : new Set(allKeys))
            }}
          >
            {SECTIONS.map(s => s.key).every(k => collapsedSections.has(k))
              ? '⊞ Expand All Agents'
              : '⊟ Collapse All Agents'}
          </button>
        </div>
      )}

      {/* Agent pipeline — tool call / result cards */}
      <div className="ar-pipeline">
        {SECTIONS.map((sec, idx) => {
          const st = sectionStatus(sec.key)
          const isAvailable = st === 'done' || st === 'working' || (sec.key === 'authorizer' && runData?.pending_approval)
          const isExpanded = isAvailable && !collapsedSections.has(sec.key)
          const hasResult = st === 'done' || (sec.key === 'authorizer' && runData?.pending_approval)
          return (
            <div key={sec.key} className={`ar-agent-pair${st === 'pending' ? ' ar-agent-pair--pending' : ''}`}>

              {/* Step number + connector line */}
              <div className="ar-step-meta">
                <div className={`ar-step-num ar-step-num--${st}`}>{idx + 1}</div>
                {idx < SECTIONS.length - 1 && <div className="ar-step-line" />}
              </div>

              <div className="ar-agent-cards">
                {/* AGENT CALL card */}
                <div className={`ar-tool-call${st === 'working' ? ' ar-tool-call--active' : ''}${st === 'pending' ? ' ar-tool-call--pending' : ''}`}>
                  <div
                    className={`ar-tool-call-header${isAvailable ? ' ar-tool-call-header--clickable' : ''}`}
                    onClick={() => isAvailable && toggleSection(sec.key)}
                  >
                    <div className={`ar-tc-icon ar-tc-icon--${sec.iconMod}`}>{sec.icon}</div>
                    <span className="ar-tc-badge ar-tc-badge--call">AGENT CALL</span>
                    <span className="ar-tc-name">{sec.label}</span>
                    {st === 'done' && runData?.agent_tokens?.[sec.key] && (
                      <span className="ar-token-badge">
                        {formatTokens(runData.agent_tokens[sec.key].total)}
                      </span>
                    )}
                    <span className="ar-tc-tag">{sec.tag}</span>
                    {st === 'working' && (
                      <span className="ar-tc-working">
                        <span className="ar-dot" /><span className="ar-dot" /><span className="ar-dot" />
                      </span>
                    )}
                    {st === 'done' && <span className="ar-tc-done">✓</span>}
                    {isAvailable && (
                      <svg className={`ar-tc-chevron${isExpanded ? ' ar-tc-chevron--open' : ''}`} viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {isExpanded && st !== 'pending' && (
                    <div className="ar-tool-call-body">
                      <AgentCallContext section={sec} runData={runData} />
                    </div>
                  )}
                </div>

                {/* AGENT RESULT card */}
                {hasResult && isExpanded && runData && (
                  <div className="ar-tool-result">
                    <div className="ar-tool-result-header">
                      <span className="ar-tc-badge ar-tc-badge--result">AGENT RESULT</span>
                      <span className="ar-tc-name">{sec.label}</span>
                      <span className="ar-tc-tag">{sec.tag}</span>
                    </div>
                    <div className="ar-tool-result-body">
                      <AgentResultContent
                        section={sec}
                        runData={runData}
                        onOverride={sec.key === 'authorizer' ? handleOverride : undefined}
                        onReject={sec.key === 'authorizer' ? handleReject : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Final answer */}
        {runData?.status === 'completed' && !runData.rejected && (
          <div className="ar-final-answer">
            <div className="ar-final-header">
              <span className="ar-final-check">✓</span>
              <span className="ar-final-title">RESOLUTION COMPLETE</span>
            </div>
            {runData.sda_summary && (
              <div className="ar-final-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{runData.sda_summary}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {runData?.status === 'failed' && runData.error && !(runData as any).rejected && (
        <div style={{ padding: '16px 24px', color: '#f85149', fontSize: '0.85rem' }}>
          <strong>Error:</strong> {runData.error}
        </div>
      )}

    </div>
  )
}
