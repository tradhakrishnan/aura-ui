import { useState, useEffect, useCallback } from 'react'
import { listRuns, type RunSummary } from '../api/agentApi'
import './TicketStatus.css'

const TOTAL_AGENTS = 8

const SEVERITY_MOD: Record<string, string> = {
  Critical: 'critical',
  High:     'high',
  Medium:   'medium',
  Low:      'low',
}

const RISK_MOD: Record<string, string> = {
  Immediate: 'immediate',
  Escalated: 'escalated',
  Normal:    'normal',
}

function statusMod(r: RunSummary): string {
  if (r.rejected)               return 'failed'
  if (r.pending_approval)       return 'pending'
  if (r.status === 'running')   return 'running'
  if (r.status === 'failed')    return 'failed'
  if (r.status === 'completed') return 'completed'
  return 'open'
}

function statusLabel(r: RunSummary): string {
  if (r.rejected)               return 'Rejected'
  if (r.pending_approval)       return 'Awaiting Approval'
  if (r.status === 'running')   return 'Running'
  if (r.status === 'failed')    return 'Failed'
  return r.ticket_status || 'Open'
}

function duration(r: RunSummary): string | null {
  if (!r.started_at || !r.completed_at) return null
  const ms = new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()
  if (ms < 0) return null
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

function formatTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ') + ' UTC'
}

interface Props {
  onViewRun: (runId: string) => void
  onBack: () => void
}

export default function TicketStatus({ onViewRun, onBack }: Props) {
  const [runs, setRuns]       = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listRuns()
      setRuns(data)
      setLastRefresh(new Date())
    } catch {/* ignore */}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  /* Auto-refresh every 5 s if any run is actively running */
  useEffect(() => {
    const hasLive = runs.some((r) => r.status === 'running')
    if (!hasLive) return
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [runs, refresh])

  const counts = {
    total:     runs.length,
    running:   runs.filter((r) => r.status === 'running' && !r.pending_approval).length,
    completed: runs.filter((r) => r.status === 'completed' && !r.rejected).length,
    failed:    runs.filter((r) => r.status === 'failed' || r.rejected).length,
    pending:   runs.filter((r) => r.pending_approval).length,
  }

  return (
    <div className="ts-page">
      {/* Header */}
      <div className="ts-header">
        <div className="ts-header-left">
          <span className="ts-logo">AURA</span>
          <div>
            <div className="ts-header-title">Ticket Status</div>
            <div className="ts-header-subtitle">Marriott Codefest 4.0</div>
          </div>
        </div>
        <div className="ts-header-right">
          <button className="ts-btn" onClick={refresh} disabled={loading}>
            {loading ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
          <button className="ts-btn" onClick={onBack}>← Back to Home</button>
        </div>
      </div>

      <div className="ts-body">
        {/* Summary bar */}
        <div className="ts-summary-bar">
          <div className="ts-summary-item">
            <span className="ts-summary-value">{counts.total}</span>
            <span className="ts-summary-label">Total</span>
          </div>
          <div className="ts-summary-divider" />
          <div className="ts-summary-item">
            <span className="ts-summary-value ts-summary-value--running">{counts.running}</span>
            <span className="ts-summary-label">Running</span>
          </div>
          <div className="ts-summary-divider" />
          <div className="ts-summary-item">
            <span className="ts-summary-value ts-summary-value--completed">{counts.completed}</span>
            <span className="ts-summary-label">Completed</span>
          </div>
          <div className="ts-summary-divider" />
          <div className="ts-summary-item">
            <span className="ts-summary-value ts-summary-value--pending">{counts.pending}</span>
            <span className="ts-summary-label">Awaiting Approval</span>
          </div>
          <div className="ts-summary-divider" />
          <div className="ts-summary-item">
            <span className="ts-summary-value ts-summary-value--failed">{counts.failed}</span>
            <span className="ts-summary-label">Failed</span>
          </div>
          <div className="ts-summary-refresh">
            Last refreshed {lastRefresh.toLocaleTimeString()}
          </div>
        </div>

        {/* Table */}
        {runs.length === 0 && !loading && (
          <div className="ts-empty">No tickets submitted yet. <button className="ts-link" onClick={onBack}>Submit one now →</button></div>
        )}

        {runs.length > 0 && (
          <div className="ts-table-wrap">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Risk</th>
                  <th>Agents</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const mod = statusMod(r)
                  const dur = duration(r)
                  return (
                    <tr key={r.run_id} className="ts-row" onClick={() => onViewRun(r.run_id)}>
                      <td>
                        <span className={`ts-status-badge ts-status-badge--${mod}`}>
                          <span className="ts-status-dot" />
                          {statusLabel(r)}
                        </span>
                      </td>
                      <td>
                        <span className="ts-ticket-id">{r.ticket_id}</span>
                        <span className="ts-run-id">{r.run_id.slice(0, 8)}…</span>
                      </td>
                      <td className="ts-title-cell">{r.ticket_title || <span className="ts-muted">—</span>}</td>
                      <td>
                        {r.ticket_severity ? (
                          <span className={`ts-severity ts-severity--${SEVERITY_MOD[r.ticket_severity] ?? 'medium'}`}>
                            {r.ticket_severity}
                          </span>
                        ) : <span className="ts-muted">—</span>}
                      </td>
                      <td>
                        {r.risk_level ? (
                          <span className={`ts-risk ts-risk--${RISK_MOD[r.risk_level] ?? 'normal'}`}>
                            {r.risk_level}
                          </span>
                        ) : <span className="ts-muted">—</span>}
                      </td>
                      <td>
                        <div className="ts-agents-cell">
                          <div className="ts-agents-bar">
                            <div
                              className="ts-agents-fill"
                              style={{ width: `${(r.agents_completed / TOTAL_AGENTS) * 100}%` }}
                            />
                          </div>
                          <span className="ts-agents-count">{r.agents_completed}/{TOTAL_AGENTS}</span>
                        </div>
                      </td>
                      <td className="ts-time">{r.started_at ? formatTime(r.started_at) : '—'}</td>
                      <td className="ts-time">{dur ?? <span className="ts-muted">—</span>}</td>
                      <td>
                        <button className="ts-view-btn" onClick={(e) => { e.stopPropagation(); onViewRun(r.run_id) }}>
                          View →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
