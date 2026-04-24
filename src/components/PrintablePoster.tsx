import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import i18n from '../i18n/index';
import type { LanguageCode } from '../i18n/index';

// --- QR code visual (21×21 modules, correct finder + timing patterns) ---
const QR_N = 21;
const QR_PX = 8;

function isFinderModule(r: number, c: number): boolean | null {
  // Top-left finder (rows 0-6, cols 0-6)
  if (r <= 6 && c <= 6) {
    if (r === 0 || r === 6 || c === 0 || c === 6) return true;
    if (r === 1 || r === 5 || c === 1 || c === 5) return false;
    return true;
  }
  // Top-right finder (rows 0-6, cols 14-20)
  if (r <= 6 && c >= 14) {
    const fc = c - 14;
    if (r === 0 || r === 6 || fc === 0 || fc === 6) return true;
    if (r === 1 || r === 5 || fc === 1 || fc === 5) return false;
    return true;
  }
  // Bottom-left finder (rows 14-20, cols 0-6)
  if (r >= 14 && c <= 6) {
    const fr = r - 14;
    if (fr === 0 || fr === 6 || c === 0 || c === 6) return true;
    if (fr === 1 || fr === 5 || c === 1 || c === 5) return false;
    return true;
  }
  return null;
}

function getQRModule(r: number, c: number): boolean {
  const finder = isFinderModule(r, c);
  if (finder !== null) return finder;

  // Separator rows/cols (always white)
  if (r === 7 && c <= 7) return false;
  if (c === 7 && r <= 7) return false;
  if (r === 7 && c >= 13) return false;
  if (c === 13 && r <= 7) return false;
  if (r >= 13 && c === 7) return false;
  if (r === 13 && c <= 7) return false;

  // Timing patterns
  if (r === 6 && c >= 8 && c <= 12) return c % 2 === 0;
  if (c === 6 && r >= 8 && r <= 12) return r % 2 === 0;

  // Required dark module
  if (r === 13 && c === 8) return true;

  // Data area — deterministic pseudo-random fill
  return (r * 43 + c * 17 + r * c * 7) % 5 < 3;
}

function QRSvg() {
  const size = QR_N * QR_PX;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="QR code — scan or visit hobosign.app"
    >
      <rect width={size} height={size} fill="#fff" />
      {Array.from({ length: QR_N }, (_, r) =>
        Array.from({ length: QR_N }, (_, c) =>
          getQRModule(r, c) ? (
            <rect
              key={`${r}-${c}`}
              x={c * QR_PX}
              y={r * QR_PX}
              width={QR_PX}
              height={QR_PX}
              fill="#000"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// --- Component ---

const FEATURE_KEYS = [
  'featureFood',
  'featureShelter',
  'featureCharging',
  'featureWater',
  'featureParks',
  'featureHarm',
] as const;

const TAB_COUNT = 8;

interface Props {
  languages: LanguageCode[];
}

export default function PrintablePoster({ languages }: Props) {
  const translators = useMemo(
    () => languages.map(lang => ({ lang, t: i18n.getFixedT(lang) })),
    [languages]
  );

  const multiLang = languages.length > 1;

  const poster = (
    <div id="print-poster-root" aria-hidden="true">
      <div className="pp-page">

        {/* ── Header ── */}
        <header className="pp-header">
          <div className="pp-title">HoboSign</div>
          <div className="pp-subtitles">
            {translators.map(({ lang, t }) => (
              <div key={lang} className="pp-subtitle">
                {t('poster.subtitle')} &middot; {t('poster.area')}
              </div>
            ))}
          </div>
        </header>

        {/* ── QR + URL ── */}
        <div className="pp-qr-section">
          <div className="pp-qr-box">
            <QRSvg />
          </div>
          <div className="pp-url">hobosign.app</div>
          <div className="pp-scan-prompts">
            {translators.map(({ lang, t }) => (
              <div key={lang} className="pp-scan-prompt">
                {t('poster.scanPrompt')}
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature list (one column per language) ── */}
        <div className={`pp-features pp-features--${languages.length}`}>
          {translators.map(({ lang, t }) => (
            <div key={lang} className="pp-feature-col">
              {multiLang && (
                <div className="pp-lang-label">{t('poster.langLabel')}</div>
              )}
              <ul className="pp-feature-list">
                {FEATURE_KEYS.map(key => (
                  <li key={key} className="pp-feature-item">
                    {t(`poster.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Legal ── */}
        <div className="pp-legal-section">
          {translators.map(({ lang, t }) => (
            <p key={lang} className="pp-legal">
              {t('poster.legal')}
            </p>
          ))}
        </div>

        {/* ── Tear-off tabs ── */}
        <div className="pp-tabs-container">
          <div className="pp-cut-line">
            <span className="pp-cut-symbol">&#x2702;</span>
            <span className="pp-cut-dashes" aria-hidden="true" />
          </div>
          <div className="pp-tabs">
            {Array.from({ length: TAB_COUNT }, (_, i) => (
              <div key={i} className="pp-tab">
                <span className="pp-tab-text">hobosign.app</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(poster, document.body);
}
