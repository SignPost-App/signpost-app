import { useState } from 'react';

interface Props {
  onDismiss: () => void;
}

const SHORT = 'This map is provided for informational purposes only. Conditions change — always use your own judgment and stay safe.';
const LONG  = `HoboSign is a community-maintained resource map. The developers make no warranties about the accuracy, safety, or availability of listed resources. This platform is not intended to facilitate illegal activity of any kind. Use of this map constitutes acceptance of these terms. If you see inaccurate or harmful content, please use the report feature. Developer contact: hobosign.app/about.`;

export default function DisclaimerBanner({ onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="disclaimer">
      <span className="disclaimer-icon">⚠️</span>
      <div className="disclaimer-text">
        {expanded ? LONG : SHORT}{' '}
        <button className="disclaimer-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Less' : 'Full disclaimer'}
        </button>
      </div>
      <button className="disclaimer-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
