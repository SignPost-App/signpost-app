import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import MapView from './components/MapView';
import ResourcePanel from './components/ResourcePanel';
import AddResourceModal from './components/AddResourceModal';
import DisclaimerBanner from './components/DisclaimerBanner';
import DemoBanner from './components/DemoBanner';
import AdminPage from './components/AdminPage';
import PosterPage from './components/PosterPage';
import { Resource, ResourceTag, Comment, AddDraft, isOpenNow } from './types';
import { mockResources } from './mockData';

function MainPage() {
  const { t } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<ResourceTag[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null);

  const tagFiltered = activeFilters.length === 0
    ? resources
    : resources.filter(r => r.tags.some(tag => activeFilters.includes(tag)));
  const filtered = openNow ? tagFiltered.filter(isOpenNow) : tagFiltered;

  const handleAddClose = (draft: AddDraft | null) => {
    setAddDraft(draft);
    setShowAdd(false);
  };

  const handleAddSubmit = (resource: Resource) => {
    setResources(prev => [...prev, resource]);
    setAddDraft(null);
    setShowAdd(false);
    setSelected(resource);
  };

  const handleAddComment = (resourceId: string, text: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      text,
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      accuracyVotes: { accurate: 0, outdated: 0 },
    };
    setResources(prev => prev.map(r =>
      r.id === resourceId ? { ...r, comments: [...r.comments, newComment] } : r
    ));
    setSelected(prev =>
      prev?.id === resourceId ? { ...prev, comments: [...prev.comments, newComment] } : prev
    );
  };

  const handleUpdateResource = (updated: Resource) => {
    setResources(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelected(updated);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">{t('skipLink')}</a>
      <div className="app-shell">
        <Header onAddClick={() => setShowAdd(true)} />
        <FilterBar
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          openNow={openNow}
          onOpenNowChange={setOpenNow}
        />
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
          <ResourcePanel
            resource={selected}
            onClose={() => setSelected(null)}
            onAddComment={handleAddComment}
            onUpdateResource={handleUpdateResource}
          />
        )}
        {showAdd && (
          <AddResourceModal
            onClose={handleAddClose}
            onSubmit={handleAddSubmit}
            draft={addDraft}
          />
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

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export default function App() {
  const [demoDismissed, setDemoDismissed] = useState(false);

  return (
    <BrowserRouter>
      <LangSync />
      {demoMode && !demoDismissed && <DemoBanner onDismiss={() => setDemoDismissed(true)} />}
      <Routes>
        <Route path="/"       element={<MainPage />} />
        <Route path="/admin"  element={<AdminPage />} />
        <Route path="/poster" element={<PosterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
