import { useState, useEffect, useCallback } from 'react'
import {
  getJiraIssues,
  submitTicket,
  type JiraIssue,
} from '../api/agentApi'
import './JiraIssues.css'

const PRIORITY_MOD: Record<string, string> = {
  Highest:  'critical',
  Critical: 'critical',
  High:     'high',
  Medium:   'medium',
  Low:      'low',
  Lowest:   'low',
}

const SEVERITY_MAP: Record<string, string> = {
  Highest:  'Critical',
  Critical: 'Critical',
  High:     'High',
  Medium:   'Medium',
  Low:      'Low',
  Lowest:   'Low',
}

const STATUS_MOD: Record<string, string> = {
  'To Do':       'todo',
  'Open':        'todo',
  'In Progress': 'progress',
  'In Review':   'progress',
  'Done':        'done',
  'Resolved':    'done',
  'Closed':      'done',
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

interface Props {
  onRunAgent: (runId: string) => void
}

export default function JiraIssues({ onRunAgent }: Props) {
  const [issues, setIssues]         = useState<JiraIssue[]>([])
  const [projectKey, setProjectKey] = useState('')
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [filter, setFilter]         = useState<'all' | 'open' | 'progress' | 'done'>('open')
  const [running, setRunning]       = useState<Record<string, boolean>>({})

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJiraIssues()
      setConfigured(data.configured)
      setIssues(data.issues)
      setProjectKey(data.project_key)
      setLastRefresh(new Date())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleRunAura = async (issue: JiraIssue) => {
    if (running[issue.key]) return
    setRunning((prev) => ({ ...prev, [issue.key]: true }))
    try {
      const desc = (issue.description || issue.summary).slice(0, 500)
      const { run_id } = await submitTicket({
        ticket_id:      issue.key,
        source:         'Jira',
        title:          issue.summary.slice(0, 200),
        description:    desc,
        severity:       SEVERITY_MAP[issue.priority] ?? 'Medium',
        reported_by:    issue.reporter ?? '',
        jira_issue_key: issue.key,
      })
      onRunAgent(run_id)
    } catch (e) {
      alert(`Failed to run AURA: ${e}`)
      setRunning((prev) => ({ ...prev, [issue.key]: false }))
    }
  }

  const filtered = issues.filter((i) => {
    if (filter === 'open')     return STATUS_MOD[i.status] === 'todo'
    if (filter === 'progress') return STATUS_MOD[i.status] === 'progress'
    if (filter === 'done')     return STATUS_MOD[i.status] === 'done'
    return true
  })

  return (
    <div className="ji-page">
      {/* Header */}
      <div className="ji-header">
        <div className="ji-header-left">
          <div className="ji-header-title">
            <svg className="ji-jira-logo" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 18.298 18.3V6.762a1.005 1.005 0 0 0-1.004-1.005zm5.701-5.757H11.48a5.215 5.215 0 0 0 5.215 5.215h2.13v2.04A5.215 5.215 0 0 0 24 12.47V1.005A1.005 1.005 0 0 0 22.995 0z" />
            </svg>
            Jira Issues
            {projectKey && <span className="ji-project-key">{projectKey}</span>}
          </div>
          <div className="ji-header-sub">
            Open issues · click <strong>▶ Run AURA</strong> to trigger the agent pipeline
          </div>
        </div>
        <div className="ji-header-right">
          <button className="ji-btn" onClick={refresh} disabled={loading}>
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
          <span className="ji-refresh-time">
            Last refreshed {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="ji-body">
        {/* Not configured */}
        {!configured && !loading && (
          <div className="ji-notice ji-notice--warn">
            <span>⚠</span>
            <div>
              <strong>Jira not configured.</strong> Add <code>JIRA_URL</code>, <code>JIRA_EMAIL</code>,
              <code>JIRA_API_TOKEN</code>, and <code>JIRA_PROJECT_KEY</code> to your <code>.env</code> and restart the backend.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ji-notice ji-notice--error">
            <span>✕</span>
            <div>Failed to load issues: {error}</div>
          </div>
        )}

        {/* Filter tabs */}
        {configured && !error && (
          <div className="ji-filters">
            {([
              { key: 'all',      label: `All`,         count: issues.length },
              { key: 'open',     label: `Open`,        count: issues.filter(i => STATUS_MOD[i.status] === 'todo').length },
              { key: 'progress', label: `In Progress`, count: issues.filter(i => STATUS_MOD[i.status] === 'progress').length },
              { key: 'done',     label: `Closed`,      count: issues.filter(i => STATUS_MOD[i.status] === 'done').length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                className={`ji-filter-btn ${filter === key ? 'ji-filter-btn--active' : ''} ${key === 'done' ? 'ji-filter-btn--done' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label} <span className="ji-filter-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Empty */}
        {configured && !loading && !error && filtered.length === 0 && (
          <div className="ji-empty">
            No {filter !== 'all' ? filter + ' ' : ''}issues found in project <strong>{projectKey}</strong>.
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div className="ji-table-wrap">
            <table className="ji-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Summary</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Reporter</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue) => {
                  const priMod    = PRIORITY_MOD[issue.priority] ?? 'medium'
                  const statMod   = STATUS_MOD[issue.status]     ?? 'todo'
                  const hasRun    = !!issue.aura_run_id
                  const isRunning = running[issue.key]

                  return (
                    <tr key={issue.key} className="ji-row">
                      <td>
                        <a
                          className="ji-key"
                          href={issue.browse_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="ji-key-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 18.298 18.3V6.762a1.005 1.005 0 0 0-1.004-1.005zm5.701-5.757H11.48a5.215 5.215 0 0 0 5.215 5.215h2.13v2.04A5.215 5.215 0 0 0 24 12.47V1.005A1.005 1.005 0 0 0 22.995 0z" />
                          </svg>
                          {issue.key}
                        </a>
                      </td>
                      <td className="ji-summary">{issue.summary}</td>
                      <td>
                        <span className={`ji-priority ji-priority--${priMod}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`ji-status ji-status--${statMod}`}>
                          <span className="ji-status-dot" />
                          {issue.status}
                        </span>
                      </td>
                      <td>
                        <span className="ji-type">{issue.issuetype}</span>
                      </td>
                      <td className="ji-reporter">{issue.reporter ?? '—'}</td>
                      <td className="ji-date">{formatDate(issue.created)}</td>
                      <td>
                        {hasRun ? (
                          <button
                            className="ji-view-btn"
                            onClick={() => onRunAgent(issue.aura_run_id!)}
                          >
                            View Run →
                          </button>
                        ) : statMod === 'done' ? (
                          <span className="ji-closed-label">✓ Closed</span>
                        ) : (
                          <button
                            className="ji-run-btn"
                            onClick={() => handleRunAura(issue)}
                            disabled={isRunning}
                          >
                            {isRunning ? '…' : '▶ Run AURA'}
                          </button>
                        )}
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
