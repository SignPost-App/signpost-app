import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

export default function AboutModal({ onClose }: Props) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const paragraphs = t('about.body').split('\n\n');

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span id="about-title" className="modal-title">{t('about.title')}</span>
          <button
            ref={closeRef}
            className="modal-close"
            aria-label={t('about.close')}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {/* App description */}
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 12 }}>
              {p}
            </p>
          ))}

          {/* How To Help */}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
              {t('about.helpTitle')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>
                {t('about.helpAddData')}
              </div>

              <div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 8 }}>
                  {t('about.helpPoster')}
                </p>
                <Link
                  to="/poster"
                  className="btn btn-outline btn-sm"
                  onClick={onClose}
                  style={{ display: 'inline-flex' }}
                >
                  {t('about.helpPosterLink')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
