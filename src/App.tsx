import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import MapView from './components/MapView';
import ResourcePanel from './components/ResourcePanel';
import AddResourceModal from './components/AddResourceModal';
import DisclaimerBanner from './components/DisclaimerBanner';
import AdminPage from './components/AdminPage';
import PosterPage from './components/PosterPage';
import { Resource, ResourceTag } from './types';
import { mockResources } from './mockData';

function MainPage() {
  const { t } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<ResourceTag[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const filtered = activeFilters.length === 0
    ? mockResources
    : mockResources.filter(r => r.tags.some(tag => activeFilters.includes(tag)));

  return (
    <>
      <a href="#main-content" className="skip-link">{t('skipLink')}</a>
      <div className="app-shell">
        <Header onAddClick={() => setShowAdd(true)} />
        <FilterBar activeFilters={activeFilters} onFilterChange={setActiveFilters} />
        {showDisclaimer && <DisclaimerBanner onDismiss={() => setShowDisclaimer(false)} />}
        <main id="main-content" className="map-area">
          <MapView
            resources={filtered}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
          <button
            className="fab"
            onClick={() => setShowAdd(true)}
            aria-label={t('addModal.title')}
          >
            +
          </button>
        </main>
        {selected && (
          <ResourcePanel resource={selected} onClose={() => setSelected(null)} />
        )}
        {showAdd && (
          <AddResourceModal onClose={() => setShowAdd(false)} />
        )}
      </div>
    </>
  );
}

function LangSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  }, [i18n.resolvedLanguage]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LangSync />
      <Routes>
        <Route path="/"       element={<MainPage />} />
        <Route path="/admin"  element={<AdminPage />} />
        <Route path="/poster" element={<PosterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
