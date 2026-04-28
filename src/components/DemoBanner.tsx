import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface Props {
  onDismiss: () => void;
}

export default function DemoSplash({ onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <div className="demo-splash" role="alertdialog" aria-modal="true" aria-labelledby="demo-splash-title">
      <div className="demo-splash-box">
        <div className="demo-splash-lang">
          <LanguageSelector />
        </div>
        <div className="demo-splash-icon" aria-hidden="true">🚧</div>
        <h1 id="demo-splash-title" className="demo-splash-title">{t('demo.splashTitle')}</h1>
        <p className="demo-splash-body">{t('demo.splashBody')}</p>
        <button className="demo-splash-btn" onClick={onDismiss} autoFocus>
          {t('demo.splashContinue')}
        </button>
      </div>
    </div>
  );
}
