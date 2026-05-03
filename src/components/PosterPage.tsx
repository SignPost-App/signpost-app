import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../i18n';
import LanguageSelectModal from './LanguageSelectModal';
import PrintablePoster from './PrintablePoster';

// Deterministic pseudo-QR pattern for the on-screen preview
const QR_CELLS = Array.from({ length: 49 }, (_, i) => {
  const row = Math.floor(i / 7);
  const col = i % 7;
  if ((row < 2 && col < 2) || (row < 2 && col >= 5) || (row >= 5 && col < 2)) return true;
  return (i * 37 + row * 13 + col * 7) % 3 !== 0;
});

export default function PosterPage() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [printLanguages, setPrintLanguages] = useState<LanguageCode[]>([]);

  // Clean up print state after the print dialog closes
  useEffect(() => {
    const handler = () => setPrintLanguages([]);
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  const handlePrintConfirm = (langs: LanguageCode[]) => {
    setShowModal(false);
    setPrintLanguages(langs);
    setTimeout(() => window.print(), 0);
  };

  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <div className="poster-page">
      {showModal && (
        <LanguageSelectModal
          onConfirm={handlePrintConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      {printLanguages.length > 0 && (
        <PrintablePoster languages={printLanguages} demoMode={demoMode} />
      )}

      <div className="poster-controls">
        <Link
          to="/"
          className="btn"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          &larr; Back to Map
        </Link>
        <button
          className="btn"
          style={{ background: '#2563eb', color: '#fff', border: 'none' }}
          onClick={() => setShowModal(true)}
        >
          &#x2B07; {t('poster.printPoster')}
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
        Print and post this in your community. Anyone can scan to access the map.
      </p>

      <div className="poster-preview">
        <div className="poster-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2 }}>
            <svg viewBox="0 0 167.96948 105" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 'auto', flexShrink: 0 }} aria-hidden="true">
              <g transform="translate(-13.366516,-85.008179)">
                <circle style={{ fill: 'none', stroke: '#111827', strokeWidth: 15 }} cx="65.866516" cy="137.50818" r="45" />
                <path style={{ fill: 'none', stroke: '#111827', strokeWidth: 15, strokeLinecap: 'round' }} d="m 110.86652,137.50818 h 59.68437" />
                <path style={{ fill: 'none', stroke: '#111827', strokeWidth: 15, strokeLinecap: 'round' }} d="m 132.05592,100.08707 38.49497,37.42111 -38.24906,36.84498" />
              </g>
            </svg>
            <div className="poster-headline">SignPost</div>
          </div>
          <div className="poster-subtitle">Community Resource Map &middot; Greater Seattle Area</div>

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
              { symbol: '●', text: 'Food banks & pantries' },
              { symbol: '●', text: 'Shelters & showers' },
              { symbol: '●', text: 'Phone charging & WiFi' },
              { symbol: '●', text: 'Drinking water & bathrooms' },
              { symbol: '●', text: 'Safe parks & covered areas' },
              { symbol: '●', text: 'Harm reduction services' },
            ].map(f => (
              <div key={f.text} className="poster-feature">
                <span style={{ fontSize: 10 }}>{f.symbol}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="poster-url">{window.location.hostname}</div>

          <div className="poster-legal">
            This map is maintained by community volunteers. Resources may change — verify before
            use. Not for illegal activity. Developers disclaim all warranties.
          </div>
        </div>
      </div>
    </div>
  );
}
