import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onDismiss: () => void;
}

export default function DisclaimerBanner({ onDismiss }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="disclaimer" role="region" aria-label="Disclaimer">
      <span className="disclaimer-icon" aria-hidden="true">⚠️</span>
      <div className="disclaimer-text">
        {expanded ? t('disclaimer.long') : t('disclaimer.short')}{' '}
        <button
          className="disclaimer-expand"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? t('disclaimer.less') : t('disclaimer.fullDisclaimer')}
        </button>
      </div>
      <button
        className="disclaimer-dismiss"
        onClick={onDismiss}
        aria-label={t('disclaimer.dismiss')}
      >
        ✕
      </button>
    </div>
  );
}
