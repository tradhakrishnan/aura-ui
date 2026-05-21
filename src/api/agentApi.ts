export interface TicketPayload {
  ticket_id: string
  source: string
  title: string
  description: string
  severity: string
  affected_system?: string
  affected_hotel?: string
  affected_location?: string
  affected_eid?: string
  reported_by?: string
  jira_issue_key?: string
}

export interface AgentMessage {
  agent: string
  content: string
  node: string
}

export interface RunData {
  run_id: string
  status: 'running' | 'completed' | 'failed'
  ticket_id: string
  ticket?: TicketPayload
  started_at?: string
  completed_at?: string
  agents_completed: string[]
  agent_conversation: AgentMessage[]
  ticket_status: string
  sda_summary: string
  spa_findings: string
  sme_verdict: string
  risk_level: string
  authorized: boolean
  pending_approval: boolean
  rejected: boolean
  execution_log: { agent: string; report: string }[]
  validation_report: { status: string; details: string }
  jira_issue_key?: string
  jira_browse_url?: string
  error?: string
  agent_tokens?: Record<string, { input: number; output: number; total: number }>
  total_tokens?: { input: number; output: number; total: number }
}

export interface RunSummary {
  run_id: string
  status: string
  ticket_id: string
  ticket_title: string
  ticket_severity: string
  ticket_status: string
  risk_level: string
  agents_completed: number
  pending_approval: boolean
  rejected: boolean
  started_at: string
  completed_at?: string
  jira_issue_key?: string
  jira_browse_url?: string
}

const BASE = '/agent'

export async function submitTicket(ticket: TicketPayload): Promise<{ run_id: string }> {
  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  })
  if (!res.ok) throw new Error(`Submit failed: ${res.statusText}`)
  return res.json()
}

export async function getRun(runId: string): Promise<RunData> {
  const res = await fetch(`${BASE}/run/${runId}`)
  if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`)
  return res.json()
}

export async function listRuns(): Promise<RunSummary[]> {
  const res = await fetch(`${BASE}/runs`)
  if (!res.ok) return []
  return res.json()
}

export async function approveRun(runId: string): Promise<void> {
  const res = await fetch(`${BASE}/run/${runId}/approve`, { method: 'POST' })
  if (!res.ok) throw new Error(`Approve failed: ${res.statusText}`)
}

export async function rejectRun(runId: string): Promise<void> {
  const res = await fetch(`${BASE}/run/${runId}/reject`, { method: 'POST' })
  if (!res.ok) throw new Error(`Reject failed: ${res.statusText}`)
}

export async function retryRun(runId: string): Promise<{ run_id: string }> {
  const res = await fetch(`${BASE}/run/${runId}/retry`, { method: 'POST' })
  if (!res.ok) throw new Error(`Retry failed: ${res.statusText}`)
  return res.json()
}

export interface PromptMessage {
  role: 'system' | 'human' | 'ai' | 'tool' | 'unknown'
  content: string
  tool_calls?: { name: string; args: Record<string, unknown>; id: string }[]
  tool_call_id?: string
}

export interface PromptEntry {
  system_prompt: string
  context: string
  messages: PromptMessage[]
  captured_at: string
}

export interface RunPrompts {
  run_id: string
  ticket_id: string
  status: string
  started_at: string
  completed_at?: string
  prompt_history: PromptEntry[]
}

export interface JiraIssue {
  key: string
  summary: string
  description: string
  priority: string
  status: string
  issuetype: string
  assignee?: string
  reporter?: string
  created?: string
  updated?: string
  browse_url: string
  aura_run_id?: string
}

export interface JiraIssuesResponse {
  configured: boolean
  issues: JiraIssue[]
  project_key: string
}

export async function getJiraIssues(): Promise<JiraIssuesResponse> {
  const res = await fetch(`${BASE}/jira/issues`)
  if (!res.ok) return { configured: false, issues: [], project_key: '' }
  return res.json()
}

export interface LlmProvider {
  id: string
  label: string
  description: string
  available: boolean
}

export interface LlmConfig {
  active: string
  providers: LlmProvider[]
  model: string
}

export async function getLlmConfig(): Promise<LlmConfig | null> {
  const res = await fetch(`${BASE}/config/llm`)
  if (!res.ok) return null
  return res.json()
}

export async function setLlmProvider(provider: string): Promise<void> {
  const res = await fetch(`${BASE}/config/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  })
  if (!res.ok) throw new Error(`Switch failed: ${res.statusText}`)
}

export async function parseTicket(text: string): Promise<TicketPayload> {
  const res = await fetch(`${BASE}/parse-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Parse failed: ${res.statusText}`)
  return res.json()
}

export async function getRunPrompts(runId: string): Promise<RunPrompts> {
  const res = await fetch(`${BASE}/run/${runId}/prompts`)
  if (!res.ok) throw new Error(`Fetch prompts failed: ${res.statusText}`)
  return res.json()
}
