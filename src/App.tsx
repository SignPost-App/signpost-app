import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
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
  const [activeFilters, setActiveFilters] = useState<ResourceTag[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const filtered = activeFilters.length === 0
    ? mockResources
    : mockResources.filter(r => r.tags.some(t => activeFilters.includes(t)));

  return (
    <div className="app-shell">
      <Header onAddClick={() => setShowAdd(true)} />
      <FilterBar activeFilters={activeFilters} onFilterChange={setActiveFilters} />
      {showDisclaimer && <DisclaimerBanner onDismiss={() => setShowDisclaimer(false)} />}
      <div className="map-area">
        <MapView
          resources={filtered}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
        <button
          className="fab"
          onClick={() => setShowAdd(true)}
          title="Add a resource"
          aria-label="Add a resource"
        >
          +
        </button>
      </div>
      {selected && (
        <ResourcePanel resource={selected} onClose={() => setSelected(null)} />
      )}
      {showAdd && <AddResourceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<MainPage />} />
        <Route path="/admin"  element={<AdminPage />} />
        <Route path="/poster" element={<PosterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
