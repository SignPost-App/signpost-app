import { Link } from 'react-router-dom';

// Deterministic pseudo-QR pattern for visual placeholder
const QR_CELLS = Array.from({ length: 49 }, (_, i) => {
  const row = Math.floor(i / 7);
  const col = i % 7;
  // Always-filled corner squares
  if ((row < 2 && col < 2) || (row < 2 && col >= 5) || (row >= 5 && col < 2)) return true;
  // Random-looking fill using prime modulo
  return (i * 37 + row * 13 + col * 7) % 3 !== 0;
});

export default function PosterPage() {
  return (
    <div className="poster-page">
      <div className="poster-controls">
        <Link to="/" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
          ← Back to Map
        </Link>
        <button
          className="btn"
          style={{ background: '#2563eb', color: '#fff', border: 'none' }}
          onClick={() => window.print()}
        >
          ⬇ Download / Print PDF
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
        Print and post this in your community. Anyone can scan to access the map.
      </p>

      <div className="poster-preview">
        <div className="poster-inner">
          <div className="poster-headline">🗺️ HoboSign</div>
          <div className="poster-subtitle">Community Resource Map · Greater Seattle Area</div>

          {/* QR placeholder */}
          <div className="poster-qr">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 3,
                width: 112,
                height: 112,
              }}
            >
              {QR_CELLS.map((filled, i) => (
                <div
                  key={i}
                  style={{
                    background: filled ? '#111827' : '#fff',
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
              QR code (generated at build)
            </div>
          </div>

          <div className="poster-scan-text">Scan for free resources near you</div>

          <div className="poster-feature-list">
            {[
              { icon: '🍎', text: 'Food banks & pantries' },
              { icon: '🏠', text: 'Shelters & showers' },
              { icon: '🔌', text: 'Phone charging & WiFi' },
              { icon: '💧', text: 'Drinking water & bathrooms' },
              { icon: '🌳', text: 'Safe parks & covered areas' },
              { icon: '💊', text: 'Harm reduction services' },
            ].map(f => (
              <div key={f.text} className="poster-feature">
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="poster-url">hobosign.app</div>

          <div className="poster-legal">
            This map is maintained by community volunteers. Resources may change — always
            verify before relying on listed information. Not intended for illegal use.
            Developers disclaim all warranties. For support: hobosign.app/about
          </div>
        </div>
      </div>
    </div>
  );
}
