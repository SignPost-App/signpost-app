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
      <header className="header" role="banner">
        <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="" aria-hidden="true" className="header-logo" />
          <div>
            <div className="header-name">SignPost</div>
            <div className="header-tagline">{t('header.tagline')}</div>
          </div>
        </Link>
        <div className="header-actions">
          <LanguageSelector />
          <button
            className="btn btn-ghost"
            onClick={() => setShowAbout(true)}
            aria-label={t('about.button')}
          >
            {t('about.button')}
          </button>
          <button className="btn btn-primary" onClick={onAddClick}>
            {t('header.add')}
          </button>
        </div>
      </header>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
