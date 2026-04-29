import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  text: string;
  onTextChange: (text: string) => void;
  onClose: () => void;    // X or outside click — preserves text
  onCancel: () => void;   // Cancel button — clears text
  onSuccess: () => void;  // Called the moment submission succeeds
  onDone: () => void;     // Done button after thank-you — closes everything
}

// TODO: Replace with a real API call when the app has a backend.
// Currently this hits the dev-server-only Vite plugin that writes to ./feedback/*.txt.
// In production builds POST /api/feedback returns 404, which is handled below.
async function submitFeedback(text: string): Promise<void> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(res.status === 404 ? 'unavailable' : `http_${res.status}`);
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'unavailable';
const MAX_CHARS = 10_000;

export default function FeedbackModal({ text, onTextChange, onClose, onCancel, onSuccess, onDone }: Props) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  const isForm = status === 'idle' || status === 'submitting' || status === 'error';

  useEffect(() => {
    if (isForm) {
      textareaRef.current?.focus();
    } else {
      doneRef.current?.focus();
    }
  }, [isForm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'submitting') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, status]);

  const handleSubmit = async () => {
    if (!text.trim() || status === 'submitting') return;
    setStatus('submitting');
    try {
      await submitFeedback(text.trim());
      onSuccess();
      setStatus('success');
    } catch (err) {
      setStatus(err instanceof Error && err.message === 'unavailable' ? 'unavailable' : 'error');
    }
  };

  const handleDone = () => {
    onTextChange('');
    onDone();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      style={!isForm ? { alignItems: 'center' } : undefined}
      onClick={e => { if (e.target === e.currentTarget && status !== 'submitting') onClose(); }}
      onAnimationEnd={e => { (e.currentTarget as HTMLElement).style.animation = 'none'; }}
    >
      <div
        className="modal"
        style={{ maxWidth: 480, ...(!isForm && { borderRadius: 'var(--radius-lg)' }) }}
        onAnimationEnd={e => {
          e.stopPropagation();
          (e.currentTarget as HTMLElement).style.animation = 'none';
        }}
      >
        <div className="modal-header">
          <span id="feedback-title" className="modal-title">{t('about.helpFeedbackTitle')}</span>
          <button
            className="modal-close"
            aria-label={t('about.close')}
            onClick={onClose}
            disabled={status === 'submitting'}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isForm ? (
            <>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)', marginBottom: 12 }}>
                {t('about.helpFeedbackDesc')}
              </p>
              <textarea
                ref={textareaRef}
                className="form-textarea"
                value={text}
                onChange={e => {
                  onTextChange(e.target.value.slice(0, MAX_CHARS));
                  if (status === 'error') setStatus('idle');
                }}
                placeholder={t('about.feedbackPlaceholder')}
                rows={6}
                disabled={status === 'submitting'}
                style={{ marginBottom: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-hint">
                  {text.length.toLocaleString()} / 10,000
                </span>
                {status === 'error' && (
                  <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>
                    {t('about.feedbackError')}
                  </span>
                )}
              </div>
            </>
          ) : status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--color-success)',
                color: '#fff',
                fontSize: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                ✓
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                {t('about.feedbackSuccess')}
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                {t('about.feedbackSuccessDesc')}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6, padding: '8px 0' }}>
              {t('about.feedbackUnavailable')}
            </p>
          )}
        </div>

        <div className="modal-footer">
          {isForm ? (
            <>
              <button
                className="btn btn-cancel"
                onClick={onCancel}
                disabled={status === 'submitting'}
              >
                {t('about.feedbackCancel')}
              </button>
              <button
                className="btn btn-submit"
                onClick={handleSubmit}
                disabled={status === 'submitting' || !text.trim()}
              >
                {status === 'submitting' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="spinner" aria-hidden="true" />
                    {t('about.feedbackSending')}
                  </span>
                ) : t('about.feedbackSubmit')}
              </button>
            </>
          ) : (
            <button ref={doneRef} className="btn btn-submit" onClick={handleDone}>
              {t('about.feedbackDone')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
