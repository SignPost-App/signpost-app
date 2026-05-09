import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut } from 'lucide-react';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import FilterBar from './components/FilterBar';
import MapView from './components/MapView';
import ResourcePanel from './components/ResourcePanel';
import AddResourceModal from './components/AddResourceModal';
import AboutModal from './components/AboutModal';
import DisclaimerBanner from './components/DisclaimerBanner';
import DemoBanner from './components/DemoBanner';
import AdminPage from './components/AdminPage';
import PosterPrintPage from './components/PosterPrintPage';
import { Resource, ResourceTag, Comment, AddDraft, isOpenNow } from './types';
import { mockResources } from './mockData';
import logo from './assets/signpost-logo.svg';

// Max zoom level proportional to device width.
// Each level adds 0.20 zoom factor; effective content width must stay >= 240px.
function computeMaxLevel(): number {
  if (window.innerWidth >= 768) return 0;
  const levels = Math.floor((window.innerWidth / 240 - 1) / 0.20);
  return Math.min(Math.max(0, levels), 5);
}

function MainPage() {
  const { t } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<ResourceTag[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null);
  const [maxLevel, setMaxLevel] = useState<number>(computeMaxLevel);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = Number(localStorage.getItem('signpost-zoom'));
    const initial = isNaN(saved) || saved < 0 ? 0 : saved;
    return Math.min(initial, computeMaxLevel());
  });

  useEffect(() => {
    localStorage.setItem('signpost-zoom', String(zoomLevel));
  }, [zoomLevel]);

  useEffect(() => {
    const handler = () => {
      const newMax = computeMaxLevel();
      setMaxLevel(newMax);
      setZoomLevel(z => Math.min(z, newMax));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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

  const zoomFactor = 1 + zoomLevel * 0.20;

  // Expose zoom factor as a CSS variable so descendant elements (modal-overlay)
  // can compensate for the parent zoom when sizing fixed-position overlays.
  const wrapperStyle = {
    '--zoom-factor': zoomFactor,
    ...(zoomLevel > 0 ? {
      zoom: zoomFactor,
      width: `calc(100dvw / ${zoomFactor})`,
      height: `calc(100dvh / ${zoomFactor})`,
    } : {}),
  };

  return (
    <>
      <a href="#main-content" className="skip-link">{t('skipLink')}</a>

      {/* Fixed brand bar — outside zoom-wrapper so it never scales with zoom. */}
      <div className="header-top-fixed" role="banner">
        <Link to="/" className="header-brand" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="" aria-hidden="true" className="header-logo" />
          <div className="header-brand-text">
            <div className="header-name">SignPost</div>
          </div>
        </Link>
      </div>

      {/* Zoom controls — also fixed outside zoom-wrapper. */}
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => setZoomLevel(z => Math.max(0, z - 1))}
          disabled={zoomLevel === 0}
          aria-label={t('header.decreaseTextSize')}
        >
          <ZoomOut size={44} aria-hidden="true" />
        </button>
        <button
          className="zoom-btn"
          onClick={() => setZoomLevel(z => Math.min(maxLevel, z + 1))}
          disabled={zoomLevel >= maxLevel}
          aria-label={t('header.increaseTextSize')}
        >
          <ZoomIn size={44} aria-hidden="true" />
        </button>
        <LanguageSelector zoomFactor={zoomFactor} />
      </div>

      <div className="zoom-wrapper" data-zoom={String(zoomLevel)} style={wrapperStyle as React.CSSProperties}>
        <div className="app-shell">
          <Header onAddClick={() => setShowAdd(true)} onAboutClick={() => setShowAbout(true)} />
          <FilterBar
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            openNow={openNow}
            onOpenNowChange={setOpenNow}
            zoomFactor={zoomFactor}
          />
          {showDisclaimer && <DisclaimerBanner onDismiss={() => setShowDisclaimer(false)} />}
          <main id="main-content" className="map-area">
            <MapView
              resources={filtered}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              zoomLevel={zoomLevel}
            />
          </main>
          {selected && (
            <ResourcePanel
              resource={selected}
              onClose={() => setSelected(null)}
              onAddComment={handleAddComment}
              onUpdateResource={handleUpdateResource}
              zoomFactor={zoomFactor}
            />
          )}
          {showAdd && (
            <AddResourceModal
              onClose={handleAddClose}
              onSubmit={handleAddSubmit}
              draft={addDraft}
            />
          )}
          {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
          <nav className="bottom-nav" aria-label="Main navigation">
            <button
              className="bottom-nav-tab"
              onClick={() => setShowAbout(true)}
              aria-label={t('about.button')}
            >
              {t('about.button')}
            </button>
            <button className="bottom-nav-tab" onClick={() => setShowAdd(true)}>
              {t('header.add')}
            </button>
          </nav>
        </div>
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
        <Route path="/poster" element={<PosterPrintPage />} />
      </Routes>
    </BrowserRouter>
  );
}
