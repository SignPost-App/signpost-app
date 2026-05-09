import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import logo from '../assets/signpost-logo.svg';

interface Props {
  onAddClick: () => void;
  onAboutClick: () => void;
}

export default function Header({ onAddClick, onAboutClick }: Props) {
  const { t } = useTranslation();

  return (
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

      {/* Row 2: regular buttons on desktop. Hidden on mobile — those actions live
          in the fixed bottom-nav rendered in App.tsx (outside the zoom-wrapper). */}
      <div className="header-bottom">
        <LanguageSelector />
        <button
          className="header-tab about-tab"
          onClick={onAboutClick}
          aria-label={t('about.button')}
        >
          {t('about.button')}
        </button>
        <button className="header-tab add-tab" onClick={onAddClick}>
          {t('header.add')}
        </button>
      </div>
    </header>
  );
}
