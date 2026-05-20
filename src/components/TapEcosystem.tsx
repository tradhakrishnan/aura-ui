import './TapEcosystem.css'

interface Client {
  name: string
  description: string
  icon: string
  direction: 'feed' | 'consume' | 'bidirectional'
  side: 'left' | 'right'
}

const clients: Client[] = [
  {
    name: 'MARSHA',
    description: 'Marriott Reservation & Hotel System',
    icon: '🌐',
    direction: 'feed',
    side: 'left',
  },
  {
    name: 'ACRS',
    description: 'Amadeus Central Reservation System',
    icon: '✈️',
    direction: 'feed',
    side: 'left',
  },
  {
    name: 'VDS / SailPoint',
    description: 'Virtual Directory & Identity Services',
    icon: '🔐',
    direction: 'feed',
    side: 'left',
  },
  {
    name: 'AgilySys',
    description: 'Property POS & F&B transactions',
    icon: '🏨',
    direction: 'consume',
    side: 'right',
  },
  {
    name: 'OCPMS',
    description: 'Opera Cloud Property Management',
    icon: '🏢',
    direction: 'consume',
    side: 'right',
  },
  {
    name: 'MiNT',
    description: 'Marriott internal reporting hub',
    icon: '📊',
    direction: 'consume',
    side: 'right',
  },
  {
    name: 'Channels',
    description: 'ResApp · Marriott.com · Mobile App',
    icon: '📱',
    direction: 'consume',
    side: 'right',
  },
]

const ArrowFeed = () => (
  <svg className="tap-arrow" viewBox="0 0 80 16" width="80" height="16">
    <line x1="4" y1="8" x2="68" y2="8" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
    <polyline points="62,4 72,8 62,12" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
  </svg>
)

const ArrowConsume = () => (
  <svg className="tap-arrow" viewBox="0 0 80 16" width="80" height="16">
    <line x1="12" y1="8" x2="76" y2="8" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5,3" />
    <polyline points="8,4 18,8 8,12" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
  </svg>
)

const ArrowBidi = () => (
  <svg className="tap-arrow" viewBox="0 0 80 16" width="80" height="16">
    <line x1="10" y1="8" x2="70" y2="8" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5,3" />
    <polyline points="6,4 16,8 6,12" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
    <polyline points="74,4 64,8 74,12" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
  </svg>
)

const ClientCard = ({ client, arrowSide }: { client: Client; arrowSide: 'left' | 'right' }) => (
  <div className={`tap-client-row tap-client-row--${arrowSide}`}>
    {arrowSide === 'right' && (
      <div className="tap-arrow-wrap">
        {client.direction === 'feed' && <ArrowFeed />}
        {client.direction === 'consume' && <ArrowConsume />}
        {client.direction === 'bidirectional' && <ArrowBidi />}
        <span className={`tap-flow-label tap-flow-label--${client.direction}`}>
          {client.direction === 'feed' ? 'Feeds Data' : 'Receives Data'}
        </span>
      </div>
    )}

    <div className={`tap-client-card tap-client-card--${client.direction}`}>
      <div className="tap-client-icon">{client.icon}</div>
      <div className="tap-client-info">
        <div className="tap-client-name">{client.name}</div>
        <div className="tap-client-desc">{client.description}</div>
      </div>
    </div>

    {arrowSide === 'left' && (
      <div className="tap-arrow-wrap">
        {client.direction === 'feed' && <ArrowFeed />}
        {client.direction === 'consume' && <ArrowConsume />}
        <span className={`tap-flow-label tap-flow-label--${client.direction}`}>
          {client.direction === 'feed' ? 'Feeds Data' : 'Receives Data'}
        </span>
      </div>
    )}
  </div>
)

const TapCore = () => (
  <div className="tap-core">
    <div className="tap-core-pulse" />
    <div className="tap-core-inner">
      <div className="tap-core-icon">🎯</div>
      <div className="tap-core-title">TAP</div>
      <div className="tap-core-subtitle">Destination Key System</div>
      <div className="tap-core-badges">
        <span className="tap-core-badge">Central Hub</span>
        <span className="tap-core-badge">Microservices</span>
      </div>
    </div>
    <div className="tap-aura-link">
      <svg width="16" height="40" viewBox="0 0 16 40">
        <line x1="8" y1="0" x2="8" y2="32" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4,3" />
        <polyline points="4,28 8,36 12,28" fill="none" stroke="#c084fc" strokeWidth="1.5" />
      </svg>
      <span className="tap-aura-link-label">AURA monitors TAP</span>
    </div>
  </div>
)

export default function TapEcosystem() {
  const leftClients  = clients.filter(c => c.side === 'left')
  const rightClients = clients.filter(c => c.side === 'right')

  return (
    <div className="tap-section">
      <div className="tap-section-header">
        <div className="tap-section-eyebrow">Destination Key System</div>
        <h2 className="tap-section-title">TAP Ecosystem</h2>
        <p className="tap-section-desc">
          TAP is the central integration platform that AURA is built to support.
          Six client systems feed data into or consume data from TAP, each representing
          a potential source of production incidents that AURA resolves.
        </p>
      </div>

      <div className="tap-diagram">
        {/* Left clients — Feed */}
        <div className="tap-clients-col">
          <div className="tap-col-label tap-col-label--feed">↘ Feed Data To TAP</div>
          {leftClients.map(c => (
            <ClientCard key={c.name} client={c} arrowSide="left" />
          ))}
        </div>

        {/* TAP Core */}
        <TapCore />

        {/* Right clients — Consume */}
        <div className="tap-clients-col">
          <div className="tap-col-label tap-col-label--consume">Receives / Requests Data From TAP ↙</div>
          {rightClients.map(c => (
            <ClientCard key={c.name} client={c} arrowSide="right" />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="tap-legend">
        <div className="tap-legend-item">
          <svg width="40" height="10" viewBox="0 0 40 10">
            <line x1="0" y1="5" x2="32" y2="5" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
            <polyline points="28,2 36,5 28,8" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          </svg>
          <span>Feeds Data To TAP</span>
        </div>
        <div className="tap-legend-item">
          <svg width="40" height="10" viewBox="0 0 40 10">
            <line x1="8" y1="5" x2="40" y2="5" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4,2" />
            <polyline points="4,2 12,5 4,8" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
          </svg>
          <span>Receives / Requests Data From TAP</span>
        </div>
        <div className="tap-legend-item">
          <div className="tap-legend-dot" style={{ background: '#a78bfa' }} />
          <span>AURA monitors & supports TAP</span>
        </div>
      </div>
    </div>
  )
}
