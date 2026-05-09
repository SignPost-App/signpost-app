import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import AboutModal from './AboutModal';
import logo from '../assets/signpost-logo.svg';

interface Props {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: Props) {
  const { t } = useTranslation();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="header">
        {/* On desktop: single row with brand left, actions right.
            On mobile: header-top is hidden — brand lives in the fixed header-top-fixed
            element in App.tsx (outside the zoom-wrapper so it never scales). */}
        <div className="header-top">
          <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
            <img src={logo} alt="" aria-hidden="true" className="header-logo" />
            <div>
              <div className="header-name">SignPost</div>
              <div className="header-tagline">{t('header.tagline')}</div>
            </div>
          </Link>
        </div>

        {/* Row 2: action tabs on mobile; regular buttons on desktop (via CSS).
            LanguageSelector is hidden on mobile (it lives in the zoom overlay instead). */}
        <div className="header-bottom">
          <LanguageSelector />
          <button
            className="header-tab about-tab"
            onClick={() => setShowAbout(true)}
            aria-label={t('about.button')}
          >
            {t('about.button')}
          </button>
          <button className="header-tab add-tab" onClick={onAddClick}>
            {t('header.add')}
          </button>
        </div>
      </header>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
