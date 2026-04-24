import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../i18n';
import LanguageSelectModal from './LanguageSelectModal';
import PrintablePoster from './PrintablePoster';

interface Props {
  onClose: () => void;
}

export default function AboutModal({ onClose }: Props) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [printLanguages, setPrintLanguages] = useState<LanguageCode[]>([]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showLangModal) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, showLangModal]);

  useEffect(() => {
    const handler = () => setPrintLanguages([]);
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  const handlePrintConfirm = (langs: LanguageCode[]) => {
    setShowLangModal(false);
    setPrintLanguages(langs);
    setTimeout(() => window.print(), 0);
  };

  const paragraphs = t('about.body').split('\n\n');

  return (
    <>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={e => { if (e.target === e.currentTarget && !showLangModal) onClose(); }}
        onAnimationEnd={e => { (e.currentTarget as HTMLElement).style.animation = 'none'; }}
      >
        <div
          className="modal"
          style={{ maxWidth: 480 }}
          onAnimationEnd={e => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).style.animation = 'none';
          }}
        >
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
            {paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 12 }}>
                {p}
              </p>
            ))}

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
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowLangModal(true)}
                    style={{ display: 'inline-flex' }}
                  >
                    {t('about.helpPosterLink')} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLangModal && (
        <LanguageSelectModal
          onConfirm={handlePrintConfirm}
          onCancel={() => setShowLangModal(false)}
        />
      )}
      {printLanguages.length > 0 && <PrintablePoster languages={printLanguages} />}
    </>
  );
}
