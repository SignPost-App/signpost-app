import { useState, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface DropdownPos { top: number; right: number; }

interface Props { zoomFactor?: number; }

export default function LanguageSelector({ zoomFactor = 1 }: Props) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const current = i18n.resolvedLanguage as LanguageCode;

  const openDropdown = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: (rect.bottom + 6) / zoomFactor,
        right: (window.innerWidth - rect.right) / zoomFactor,
      });
    }
    setOpen(true);
  };

  const select = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    setOpen(false);
    buttonRef.current?.focus();
  };

  useOutsideClick(containerRef, () => setOpen(false), open);

  // Keyboard navigation on the button
  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openDropdown();
    }
  };

  // Keyboard navigation inside the open dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = document.querySelectorAll<HTMLElement>(`#${CSS.escape(listboxId)} [role="option"]`);
      const idx = Array.from(items).findIndex(el => el === document.activeElement);
      const next = e.key === 'ArrowDown'
        ? Math.min(idx + 1, items.length - 1)
        : Math.max(idx - 1, 0);
      items[next]?.focus();
    }
  };

  return (
    <div ref={containerRef} className="lang-selector">
      <button
        ref={buttonRef}
        className="lang-btn"
        aria-label={t('header.selectLanguage')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleButtonKeyDown}
      >
        {/* Globe SVG — universally recognized language icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-current" aria-hidden="true">
          {current?.toUpperCase()}
        </span>
      </button>

      {open && pos && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('header.selectLanguage')}
          className="lang-dropdown"
          style={{ top: pos.top, right: pos.right, zoom: zoomFactor }}
          onKeyDown={handleDropdownKeyDown}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <li
              key={lang.code}
              role="option"
              aria-selected={current === lang.code}
              tabIndex={0}
              className={`lang-option ${current === lang.code ? 'selected' : ''}`}
              onClick={() => select(lang.code)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(lang.code);
                }
              }}
            >
              {current === lang.code && (
                <span className="lang-check" aria-hidden="true">✓</span>
              )}
              {lang.nativeName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
