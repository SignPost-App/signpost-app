import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import i18n from '../i18n/index';
import type { LanguageCode } from '../i18n/index';

function formatPrintDate(): string {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- SignPost logo (inline, black) ---
function LogoSvg() {
  return (
    <svg
      width="100%"
      viewBox="0 0 167.96948 105"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SignPost logo"
      className="pp-logo-svg"
    >
      <g transform="translate(-13.366516,-85.008179)">
        <circle
          style={{ fill: 'none', stroke: '#000', strokeWidth: 15, strokeDasharray: 'none', strokeOpacity: 1 }}
          cx="65.866516" cy="137.50818" r="45"
        />
        <path
          style={{ fill: 'none', stroke: '#000', strokeWidth: 15, strokeLinecap: 'round', strokeDasharray: 'none', strokeOpacity: 1 }}
          d="m 110.86652,137.50818 h 59.68437"
        />
        <path
          style={{ fill: 'none', stroke: '#000', strokeWidth: 15, strokeLinecap: 'round', strokeDasharray: 'none', strokeOpacity: 1 }}
          d="m 132.05592,100.08707 38.49497,37.42111 -38.24906,36.84498"
        />
      </g>
    </svg>
  );
}

// --- Real QR code using qrcode library ---
function QRSvg({ url, pixelsPerModule = 6 }: { url: string; pixelsPerModule?: number }) {
  const { data, size } = useMemo(() => {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    return { data: qr.modules.data, size: qr.modules.size };
  }, [url]);

  const svgSize = size * pixelsPerModule;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`QR code — scan or visit ${url}`}
    >
      <rect width={svgSize} height={svgSize} fill="#fff" />
      {Array.from(data).map((dark, i) => {
        if (!dark) return null;
        const r = Math.floor(i / size);
        const c = i % size;
        return (
          <rect
            key={i}
            x={c * pixelsPerModule}
            y={r * pixelsPerModule}
            width={pixelsPerModule}
            height={pixelsPerModule}
            fill="#000"
          />
        );
      })}
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
  demoMode?: boolean;
}

export default function PrintablePoster({ languages, demoMode }: Props) {
  const translators = useMemo(
    () => languages.map(lang => ({ lang, t: i18n.getFixedT(lang) })),
    [languages]
  );

  const multiLang = languages.length > 1;
  const url = window.location.origin;

  const poster = (
    <div id="print-poster-root" aria-hidden="true">
      <div className="pp-page">

        {demoMode && (
          <div className="pp-demo-watermark" aria-hidden="true">
            <span>{i18n.t('demo.posterWatermark')}</span>
          </div>
        )}

        {/* ── Header ── */}
        <header className="pp-header">
          <div className="pp-header-top">
            <div className="pp-date">{formatPrintDate()}</div>
          </div>
          <div className="pp-title-row">
            <LogoSvg />
            <div className="pp-title">SignPost</div>
          </div>
          <div className="pp-subtitles">
            {translators.map(({ lang, t }) => (
              <div key={lang} className="pp-subtitle">
                {t('poster.subtitle')} &middot; {t('poster.area')}
              </div>
            ))}
          </div>
        </header>

        {/* ── QR + URL (horizontal: QR left, text right) ── */}
        <div className="pp-qr-section">
          <div className="pp-qr-box">
            <QRSvg url={url} pixelsPerModule={6} />
          </div>
          <div className="pp-qr-text">
            <div className="pp-url">{window.location.hostname}</div>
            <div className="pp-scan-prompts">
              {translators.map(({ lang, t }) => (
                <div key={lang} className="pp-scan-prompt">
                  {t('poster.scanPrompt')}
                </div>
              ))}
            </div>
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

        {/* ── Tear-off tabs ── */}
        <div className="pp-tabs-container">
          <div className="pp-cut-line">
            <span className="pp-cut-dashes" aria-hidden="true" />
          </div>
          <div className="pp-tabs">
            {Array.from({ length: TAB_COUNT }, (_, i) => (
              <div key={i} className="pp-tab">
                <span className="pp-tab-text">{window.location.hostname}</span>
                <div className="pp-tab-qr">
                  <QRSvg url={url} pixelsPerModule={3} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(poster, document.body);
}
