import { useState, useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ALL_TAGS, ResourceTag, TAG_CONFIG, Resource, HoursValue, EMPTY_HOURS, AddDraft, hoursToString } from '../types';
import HoursPicker from './HoursPicker';

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

const dropPinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))" aria-hidden="true">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function MapClickHandler({ onPin }: { onPin: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPin(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyToPinEffect({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  const prevRef = useRef<string>('');
  useEffect(() => {
    if (lat === null || lng === null) return;
    const key = `${lat},${lng}`;
    if (prevRef.current === key) return;
    prevRef.current = key;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  onClose: (draft: AddDraft | null) => void;
  onSubmit: (resource: Resource) => void;
  draft: AddDraft | null;
}

const emptyDraft = (): AddDraft => ({
  name: '',
  selectedTags: [],
  locationMode: 'address',
  address: '',
  pinLat: null,
  pinLng: null,
  hours: { ...EMPTY_HOURS, days: Array.from({ length: 7 }, () => ({ open: false, openTime: '08:00', closeTime: '17:00' })) },
  description: '',
});

export default function AddResourceModal({ onClose, onSubmit, draft }: Props) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [name, setName] = useState(draft?.name ?? '');
  const [selectedTags, setSelectedTags] = useState<ResourceTag[]>(draft?.selectedTags ?? []);
  const [locationMode, setLocationMode] = useState<'address' | 'coords'>(draft?.locationMode ?? 'address');
  const [address, setAddress] = useState(draft?.address ?? '');
  const [pinLat, setPinLat] = useState<number | null>(draft?.pinLat ?? null);
  const [pinLng, setPinLng] = useState<number | null>(draft?.pinLng ?? null);
  const [hours, setHours] = useState<HoursValue>(draft?.hours ?? { ...EMPTY_HOURS, days: Array.from({ length: 7 }, () => ({ open: false, openTime: '08:00', closeTime: '17:00' })) });
  const [description, setDescription] = useState(draft?.description ?? '');

  // Keep a ref to current form state so event handlers don't go stale
  const draftRef = useRef<AddDraft>(emptyDraft());
  draftRef.current = { name, selectedTags, locationMode, address, pinLat, pinLng, hours, description };

  const toggleTag = (tag: ResourceTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClear = () => {
    const d = emptyDraft();
    setName(d.name);
    setSelectedTags(d.selectedTags);
    setLocationMode(d.locationMode);
    setAddress(d.address);
    setPinLat(d.pinLat);
    setPinLng(d.pinLng);
    setHours(d.hours);
    setDescription(d.description);
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedTags.length === 0) return;
    const lat = pinLat ?? (47.6062 + (Math.random() - 0.5) * 0.05);
    const lng = pinLng ?? (-122.3321 + (Math.random() - 0.5) * 0.05);
    const resource: Resource = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      lat,
      lng,
      tags: selectedTags,
      address: address.trim() || undefined,
      hours: hoursToString(hours) || undefined,
      description: description.trim() || undefined,
      comments: [],
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    onSubmit(resource);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setPinLat(pos.coords.latitude);
      setPinLng(pos.coords.longitude);
      setLocationMode('coords');
    });
  };

  const canSubmit = name.trim().length > 0 && selectedTags.length > 0;

  // Focus first element when modal opens
  useEffect(() => {
    const first = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    first?.focus();
  }, []);

  // Focus trap + Escape key (uses draftRef to avoid stale closure)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(draftRef.current); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={e => e.target === e.currentTarget && onClose(draftRef.current)}
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <span id={titleId} className="modal-title">{t('addModal.title')}</span>
          <button
            className="modal-close"
            onClick={() => onClose(draftRef.current)}
            aria-label={t('addModal.close')}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="resource-name">
              {t('addModal.nameLabel')} *
            </label>
            <input
              id="resource-name"
              className="form-input"
              placeholder={t('addModal.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <span className="form-label" id="tags-label">
              {t('addModal.typeLabel')} *
            </span>
            <div className="tag-checkboxes" role="group" aria-labelledby="tags-label">
              {ALL_TAGS.map(tag => {
                const cfg = TAG_CONFIG[tag];
                const checked = selectedTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`tag-checkbox ${checked ? 'checked' : ''}`}
                    style={checked
                      ? { background: cfg.bgColor, borderColor: cfg.color, color: cfg.color }
                      : {}}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTag(tag)}
                      aria-label={`${cfg.icon} ${t(`tags.${tag}`)}`}
                    />
                    <span aria-hidden="true">{cfg.icon}</span>
                    {t(`tags.${tag}`)}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <span className="form-label" id="location-label">
              {t('addModal.locationLabel')} *
            </span>
            <div
              role="group"
              aria-labelledby="location-label"
              style={{ display: 'flex', gap: 8, marginBottom: 8 }}
            >
              <button
                type="button"
                className="btn btn-sm"
                style={locationMode === 'address'
                  ? { background: 'var(--color-primary)', color: '#fff', border: 'none' }
                  : { background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                onClick={() => setLocationMode('address')}
                aria-pressed={locationMode === 'address'}
              >
                {t('addModal.address')}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={locationMode === 'coords'
                  ? { background: 'var(--color-primary)', color: '#fff', border: 'none' }
                  : { background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                onClick={() => setLocationMode('coords')}
                aria-pressed={locationMode === 'coords'}
              >
                {t('addModal.dropPin')}
              </button>
            </div>

            {locationMode === 'address' ? (
              <div className="location-row">
                <input
                  className="form-input"
                  placeholder={t('addModal.addressPlaceholder')}
                  aria-label={t('addModal.addressPlaceholder')}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-locate"
                  onClick={handleUseMyLocation}
                  title={t('addModal.useMyLocation')}
                >
                  <span aria-hidden="true">📍</span>
                  <span className="sr-only">{t('addModal.useMyLocation')}</span>
                  <span aria-hidden="true">{t('addModal.useMyLocation')}</span>
                </button>
              </div>
            ) : (
              <div className="drop-pin-container">
                <div className="drop-pin-hint">
                  {pinLat === null
                    ? <><span aria-hidden="true">👆</span> {t('addModal.dropPinInstruction')}</>
                    : <><span aria-hidden="true">✅</span> {t('addModal.dropPinPlaced')}</>
                  }
                </div>
                <div className="drop-pin-map">
                  <MapContainer
                    center={[47.6062, -122.3321]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapClickHandler onPin={(lat, lng) => { setPinLat(lat); setPinLng(lng); }} />
                    <FlyToPinEffect lat={pinLat} lng={pinLng} />
                    {pinLat !== null && pinLng !== null && (
                      <Marker
                        position={[pinLat, pinLng]}
                        icon={dropPinIcon}
                        draggable
                        eventHandlers={{
                          dragend: e => {
                            const latlng = (e.target as L.Marker).getLatLng();
                            setPinLat(latlng.lat);
                            setPinLng(latlng.lng);
                          },
                        }}
                      />
                    )}
                  </MapContainer>
                </div>
                {pinLat !== null && (
                  <div className="drop-pin-coords">
                    <span>📍 {pinLat.toFixed(5)}, {pinLng!.toFixed(5)}</span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => { setPinLat(null); setPinLng(null); }}
                    >
                      {t('addModal.removePin')}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="form-hint">{t('addModal.locationTip')}</div>
          </div>

          {/* Hours */}
          <div className="form-group">
            <span className="form-label">{t('addModal.hoursLabel')}</span>
            <HoursPicker value={hours} onChange={setHours} />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="resource-description">
              {t('addModal.descriptionLabel')}
            </label>
            <textarea
              id="resource-description"
              className="form-textarea"
              placeholder={t('addModal.descriptionPlaceholder')}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {t('addModal.disclaimer')}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={() => onClose(null)}>
            {t('addModal.cancel')}
          </button>
          <button className="btn-clear" onClick={handleClear}>
            {t('addModal.clear')}
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.55 }}
            aria-disabled={!canSubmit}
          >
            {t('addModal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
