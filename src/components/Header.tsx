import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface Props {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: Props) {
  const { t } = useTranslation();

  return (
    <header className="header" role="banner">
      <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
        <span className="header-logo" aria-hidden="true">🗺️</span>
        <div>
          <div className="header-name">HoboSign</div>
          <div className="header-tagline">{t('header.tagline')}</div>
        </div>
      </Link>
      <div className="header-actions">
        <LanguageSelector />
        <button className="btn btn-primary" onClick={onAddClick}>
          {t('header.add')}
        </button>
        <Link to="/poster" className="btn btn-ghost">{t('header.poster')}</Link>
        <Link to="/admin"  className="btn btn-ghost">{t('header.admin')}</Link>
      </div>
    </header>
  );
}
