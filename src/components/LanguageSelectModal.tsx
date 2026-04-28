import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n';

interface Props {
  onConfirm: (langs: LanguageCode[]) => void;
  onCancel: () => void;
}

export default function LanguageSelectModal({ onConfirm, onCancel }: Props) {
  const { t, i18n } = useTranslation();
  const defaultLang = (SUPPORTED_LANGUAGES.find(l => l.code === i18n.resolvedLanguage)?.code ?? 'en') as LanguageCode;
  const [selected, setSelected] = useState<Set<LanguageCode>>(new Set([defaultLang]));
  const firstCheckRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    firstCheckRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const toggle = useCallback((code: LanguageCode) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code);
      } else {
        if (next.size < 3) next.add(code);
      }
      return next;
    });
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onCancel();
  };

  const orderedSelected = SUPPORTED_LANGUAGES
    .filter(l => selected.has(l.code))
    .map(l => l.code);

  return (
    <div
      ref={backdropRef}
      className="lang-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-modal-title"
      onClick={handleBackdropClick}
    >
      <div className="lang-modal">
        <h2 id="lang-modal-title" className="lang-modal-title">
          {t('poster.selectLanguages')}
        </h2>
        <p className="lang-modal-hint">{t('poster.selectLanguagesHint')}</p>

        <div
          className="lang-modal-options"
          role="group"
          aria-label={t('poster.selectLanguages')}
        >
          {SUPPORTED_LANGUAGES.map((lang, i) => {
            const isChecked = selected.has(lang.code);
            const isDisabled = isChecked && selected.size === 1;
            return (
              <label
                key={lang.code}
                className={`lang-modal-option${isChecked ? ' lang-modal-option--checked' : ''}`}
              >
                <input
                  ref={i === 0 ? firstCheckRef : undefined}
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggle(lang.code)}
                  aria-describedby={isDisabled ? 'lang-modal-min-note' : undefined}
                />
                <span>{lang.nativeName}</span>
              </label>
            );
          })}
        </div>

        <p id="lang-modal-min-note" className="lang-modal-min-note">
          {selected.size >= 3 ? 'Maximum 3 languages selected.' : ' '}
        </p>

        <div className="lang-modal-actions">
          <button className="btn lang-modal-cancel" onClick={onCancel}>
            {t('poster.cancel')}
          </button>
          <button
            className="btn lang-modal-confirm"
            onClick={() => onConfirm(orderedSelected)}
          >
            {t('poster.printPoster')}
          </button>
        </div>
      </div>
    </div>
  );
}
