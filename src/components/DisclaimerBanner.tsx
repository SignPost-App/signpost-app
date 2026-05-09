import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onDismiss: () => void;
}

export default function DisclaimerBanner({ onDismiss }: Props) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showModal) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showModal]);

  return (
    <>
      <div className="disclaimer" role="region" aria-label="Disclaimer">
        <span className="disclaimer-icon" aria-hidden="true">⚠️</span>
        <div className="disclaimer-text">
          {t('disclaimer.short')}{' '}
          <button
            className="disclaimer-expand"
            onClick={() => setShowModal(true)}
          >
            {t('disclaimer.fullDisclaimer')}
          </button>
        </div>
        <button
          className="disclaimer-dismiss"
          onClick={onDismiss}
          aria-label={t('disclaimer.dismiss')}
        >
          ✕
        </button>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclaimer-modal-title"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span id="disclaimer-modal-title" className="modal-title">⚠️ {t('disclaimer.fullDisclaimer')}</span>
              <button
                ref={closeRef}
                className="modal-close"
                aria-label={t('disclaimer.dismiss')}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 12 }}>
                {t('disclaimer.short')}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>
                {t('disclaimer.long')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
