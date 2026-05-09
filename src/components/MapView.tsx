import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Resource, TAG_CONFIG, ResourceTag } from '../types';

const DEFAULT_CENTER: [number, number] = [47.6062, -122.3321];
const DEFAULT_ZOOM = 13;

function createPinIcon(tags: ResourceTag[], selected: boolean) {
  const primary = tags[0];
  const cfg = TAG_CONFIG[primary];
  const isAvoid = tags.includes('avoid');
  const size = selected ? 48 : 42;
  const borderWidth = selected ? 3.5 : 3;

  // Only rotate the diamond shape when avoid is the sole tag
  const shouldRotate = isAvoid && tags.length === 1;

  // Show up to 3 emojis; overflow as +N
  const maxEmojis = 3;
  const shown = tags.slice(0, maxEmojis);
  const extra = tags.length > maxEmojis ? tags.length - maxEmojis : 0;
  const emojiSize = shown.length > 2 ? 16 : shown.length > 1 ? 18 : 22;

  // Pill grows wider for each additional emoji
  const width = size + (shown.length - 1) * 22 + (extra > 0 ? 14 : 0);

  const emojisHtml =
    shown.map(t => `<span>${TAG_CONFIG[t].icon}</span>`).join('') +
    (extra > 0
      ? `<span style="font-size:9px;font-weight:700;color:${isAvoid ? '#fff' : '#555'}">+${extra}</span>`
      : '');

  const inner = `
    <div style="
      width: ${width}px;
      height: ${size}px;
      border-radius: ${shouldRotate ? '5px' : `${size / 2}px`};
      background: ${isAvoid ? cfg.bgColor : '#fff'};
      border: ${borderWidth}px solid ${cfg.color};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      font-size: ${emojiSize}px;
      box-shadow: ${selected
        ? `0 0 0 4px ${cfg.color}40, 0 3px 12px rgba(0,0,0,0.3)`
        : '0 2px 8px rgba(0,0,0,0.25)'};
      cursor: pointer;
      transition: transform 0.15s;
      transform: ${shouldRotate ? 'rotate(45deg)' : 'none'};
      box-sizing: border-box;
      white-space: nowrap;
    ">
      <span style="
        transform: ${shouldRotate ? 'rotate(-45deg)' : 'none'};
        display: flex;
        gap: 2px;
        align-items: center;
        line-height: 1;
      ">
        ${emojisHtml}
      </span>
    </div>
  `;

  return L.divIcon({
    className: '',
    html: inner,
    iconSize: [width, size],
    iconAnchor: [width / 2, size / 2],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterCustomIcon(cluster: any): L.DivIcon {
  const count: number = cluster.getChildCount();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers: any[] = cluster.getAllChildMarkers();

  // Collect unique tags from all markers in the cluster
  const tagSet = new Set<ResourceTag>();
  for (const m of markers) {
    try {
      const tags: ResourceTag[] = JSON.parse(m.options.title || '[]');
      tags.forEach(t => tagSet.add(t));
    } catch { /* ignore malformed */ }
  }

  const tags = Array.from(tagSet);
  const shown = tags.slice(0, 4);

  // 1–2 emojis: single row; 3–4: 2×2 grid
  let emojiHtml: string;
  if (shown.length <= 2) {
    emojiHtml = `
      <div style="display:flex;gap:3px;font-size:21px;line-height:1;">
        ${shown.map(t => `<span>${TAG_CONFIG[t].icon}</span>`).join('')}
      </div>`;
  } else {
    emojiHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:17px;line-height:1.1;text-align:center;">
        ${shown.map(t => `<span>${TAG_CONFIG[t].icon}</span>`).join('')}
      </div>`;
  }

  return L.divIcon({
    html: `
      <div style="
        width: 70px;
        height: 70px;
        background: white;
        border: 3px solid #6366f1;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 14px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
        box-sizing: border-box;
      ">
        ${emojiHtml}
        <span style="
          position: absolute;
          bottom: -10px;
          background: #6366f1;
          color: white;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          line-height: 1.5;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          font-family: sans-serif;
        ">${count}</span>
      </div>
    `,
    className: '',
    iconSize: L.point(70, 80),
    iconAnchor: L.point(35, 45),
  });
}

const userLocationIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#2563eb;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 3px rgba(37,99,235,0.3),0 2px 8px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface Props {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (r: Resource) => void;
  zoomLevel: number;
}

export default function MapView({ resources, selectedId, onSelect, zoomLevel }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    const id = setTimeout(() => { mapRef.current?.invalidateSize(); }, 150);
    return () => clearTimeout(id);
  }, [zoomLevel]);

  const handleLocate = () => {
    if (userPos) {
      mapRef.current?.flyTo(userPos, 15, { animate: true, duration: 1.5 });
      return;
    }
    if (locating) return;
    if (!navigator.geolocation) {
      alert('Location access is not available in your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(latlng);
        mapRef.current?.flyTo(latlng, 15, { animate: true, duration: 1.5 });
        setLocating(false);
      },
      err => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert('Location access was denied for this site. In Chrome, tap the lock icon in the address bar → Permissions → Location → Allow.');
        }
      },
      { timeout: 10000, maximumAge: 30000, enableHighAccuracy: true },
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
        >
          {resources.map(r => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createPinIcon(r.tags, r.id === selectedId)}
              title={JSON.stringify(r.tags)}
              eventHandlers={{ click: () => onSelect(r) }}
            />
          ))}
        </MarkerClusterGroup>
        {userPos && (
          <Marker position={userPos} icon={userLocationIcon} zIndexOffset={1000} />
        )}
      </MapContainer>
      <button
        className={`locate-btn${locating ? ' locate-btn--loading' : ''}`}
        onClick={handleLocate}
        aria-label="Go to my location"
        title="Go to my location"
      >
        {locating ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" aria-hidden="true" className="locate-spinner">
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
            <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        )}
      </button>
    </div>
  );
}
