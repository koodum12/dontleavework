import type { LocationFile } from '@/data/types';

interface Props {
  open: boolean;
  locations: LocationFile;
  currentLocation: string;
  onClose: () => void;
}

const NODES = {
  home: { x: 10, y: 62, short: 'HOME' },
  street: { x: 27, y: 45, short: 'STREET' },
  cafe: { x: 42, y: 20, short: 'CAFE' },
  lobby: { x: 55, y: 45, short: 'LOBBY' },
  office: { x: 78, y: 20, short: '2F OFFICE' },
  corridor: { x: 82, y: 48, short: 'CORRIDOR' },
  control_room: { x: 62, y: 68, short: 'SECURITY' },
} as const;

const LINKS: Array<[keyof typeof NODES, keyof typeof NODES]> = [
  ['home', 'street'], ['street', 'cafe'], ['street', 'lobby'], ['cafe', 'lobby'],
  ['lobby', 'office'], ['lobby', 'control_room'], ['office', 'corridor'], ['corridor', 'control_room'],
];

export default function WorldMap({ open, locations, currentLocation, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="ui-modal-backdrop world-map-backdrop" role="presentation" onClick={onClose}>
      <section
        className="ui-modal world-map-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-map-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ui-modal-header">
          <div>
            <span className="world-map-kicker">AREA NETWORK</span>
            <h2 id="world-map-title">이동 지도</h2>
          </div>
          <button type="button" className="ui-icon-button" onClick={onClose} aria-label="지도 닫기" title="닫기">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="world-map-canvas">
          <svg className="world-map-links" viewBox="0 0 100 100" aria-hidden="true">
            {LINKS.map(([from, to]) => (
              <line
                key={`${from}-${to}`}
                x1={NODES[from].x}
                y1={NODES[from].y}
                x2={NODES[to].x}
                y2={NODES[to].y}
              />
            ))}
          </svg>

          {Object.entries(NODES).map(([id, node]) => {
            const active = id === currentLocation;
            const location = locations[id];
            return (
              <div
                key={id}
                className={`world-map-node${active ? ' is-current' : ''}`}
                data-location={id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span className="world-map-node-code">{node.short}</span>
                <strong>{location?.name ?? id}</strong>
                {active && <small>현재 위치</small>}
              </div>
            );
          })}
        </div>

        <footer className="world-map-footer">
          <span><i className="world-map-current-dot" />현재 위치</span>
          <span>출입구와 엘리베이터 연결 기준</span>
        </footer>
      </section>
    </div>
  );
}
