import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../i18n';
import FeedbackModal from './FeedbackModal';
import LanguageSelectModal from './LanguageSelectModal';


interface Props {
  onClose: () => void;
}

const subsectionLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-muted)' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: 6,
};

export default function AboutModal({ onClose }: Props) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showLangModal && !showFeedbackModal) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, showLangModal, showFeedbackModal]);

  const handlePrintConfirm = (langs: LanguageCode[]) => {
    setShowLangModal(false);
    window.open(`/poster?langs=${langs.join(',')}`, '_blank');
  };

  const handleFeedbackSuccess = () => {
    setAboutVisible(false);
  };

  const handleFeedbackDone = () => {
    setFeedbackText('');
    setShowFeedbackModal(false);
    onClose();
  };

  const paragraphs = t('about.body').split('\n\n');

  return (
    <>
      {aboutVisible && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
          onClick={e => { if (e.target === e.currentTarget && !showLangModal && !showFeedbackModal) onClose(); }}
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
                ✕
              </button>
            </div>
            <div className="modal-body">
              {paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 12 }}>
                  {p}
                </p>
              ))}

              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
                  {t('about.helpTitle')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Adding & Updating Resources */}
                  <div>
                    <p style={subsectionLabelStyle}>{t('about.helpAddTitle')}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>
                      {t('about.helpAddData')}
                    </p>
                  </div>

                  {/* Printing Posters */}
                  <div>
                    <p style={subsectionLabelStyle}>{t('about.helpPosterTitle')}</p>
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

                  {/* Give Feedback */}
                  <div>
                    <p style={subsectionLabelStyle}>{t('about.helpFeedbackTitle')}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 8 }}>
                      {t('about.helpFeedbackDesc')}
                    </p>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowFeedbackModal(true)}
                      style={{ display: 'inline-flex' }}
                    >
                      {t('about.helpFeedbackTitle')} →
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLangModal && (
        <LanguageSelectModal
          onConfirm={handlePrintConfirm}
          onCancel={() => setShowLangModal(false)}
        />
      )}
      {showFeedbackModal && (
        <FeedbackModal
          text={feedbackText}
          onTextChange={setFeedbackText}
          onClose={() => setShowFeedbackModal(false)}
          onCancel={() => { setFeedbackText(''); setShowFeedbackModal(false); }}
          onSuccess={handleFeedbackSuccess}
          onDone={handleFeedbackDone}
        />
      )}
    </>
  );
}
