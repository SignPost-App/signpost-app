import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PrintablePoster from './PrintablePoster';
import type { LanguageCode } from '../i18n';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export default function PosterPrintPage() {
  const [searchParams] = useSearchParams();
  const langs = (searchParams.get('langs') ?? 'en').split(',') as LanguageCode[];

  useEffect(() => {
    document.documentElement.classList.add('pp-printing');
    document.body.classList.add('pp-printing');
    return () => {
      document.documentElement.classList.remove('pp-printing');
      document.body.classList.remove('pp-printing');
    };
  }, []);

  return (
    <>
      <div className="pp-save-bar">
        <button className="pp-save-btn" onClick={() => window.print()}>
          Save as PDF ↓
        </button>
      </div>
      <PrintablePoster languages={langs} demoMode={demoMode} />
    </>
  );
}
