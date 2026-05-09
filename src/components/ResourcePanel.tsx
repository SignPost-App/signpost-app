import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Resource, ResourceTag, TAG_CONFIG, ALL_TAGS, HoursValue, DayHours, DEFAULT_HOURS, parseHoursString, hoursToString, WifiNetwork } from '../types';
import { reverseGeocode } from '../geocode';
import HoursPicker from './HoursPicker';
import WifiNetworkPicker from './WifiNetworkPicker';

// ─── Map helpers ──────────────────────────────────────────────────────────────

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

function FlyToPinEffect({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef<string>('');
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (prevRef.current === key) return;
    prevRef.current = key;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

// ─── Word-level diff ──────────────────────────────────────────────────────────

type Token = { text: string; type: 'same' | 'removed' | 'added' };

function wordDiff(from: string, to: string): Token[] {
  const a = from.match(/\S+|\s+/g) ?? [];
  const b = to.match(/\S+|\s+/g) ?? [];
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result: Token[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      result.unshift({ text: a[i-1], type: 'same' }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ text: b[j-1], type: 'added' }); j--;
    } else {
      result.unshift({ text: a[i-1], type: 'removed' }); i--;
    }
  }
  return result;
}

function InlineDiff({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === 'same')    return <span key={i}>{tok.text}</span>;
        if (tok.type === 'removed') return <del key={i} style={{ color: '#b91c1c', textDecoration: 'line-through', opacity: 0.8 }}>{tok.text}</del>;
        return <mark key={i} style={{ background: '#dcfce7', color: '#166534', borderRadius: 2, padding: '0 1px', fontWeight: 600, fontStyle: 'normal' }}>{tok.text}</mark>;
      })}
    </>
  );
}

// ─── Wi-Fi diff ───────────────────────────────────────────────────────────────

type WifiNetChange =
  | { kind: 'added';   net: WifiNetwork }
  | { kind: 'removed'; net: WifiNetwork }
  | { kind: 'changed'; ssid: string; from: WifiNetwork; to: WifiNetwork };

function diffWifiNetworks(from: WifiNetwork[], to: WifiNetwork[]): WifiNetChange[] {
  const result: WifiNetChange[] = [];
  const fromMap = new Map(from.map(n => [n.ssid, n]));
  const toMap   = new Map(to.map(n => [n.ssid, n]));
  for (const net of from) {
    const toNet = toMap.get(net.ssid);
    if (!toNet) result.push({ kind: 'removed', net });
    else if (JSON.stringify(net) !== JSON.stringify(toNet))
      result.push({ kind: 'changed', ssid: net.ssid, from: net, to: toNet });
  }
  for (const net of to) {
    if (!fromMap.has(net.ssid)) result.push({ kind: 'added', net });
  }
  return result;
}

// ─── Diff entry types ─────────────────────────────────────────────────────────

type SimpleDiff = { kind: 'simple'; label: string; from: string; to: string };
type TagsDiff   = { kind: 'tags';   added: ResourceTag[]; removed: ResourceTag[] };
type HoursDiff  = { kind: 'hours';  days: { day: string; from: string; to: string }[] };
type WifisDiff  = { kind: 'wifi';   changes: WifiNetChange[] };
type DiffEntry  = SimpleDiff | TagsDiff | HoursDiff | WifisDiff;

const fmtTime = (t: string | null): string => {
  if (!t) return '?';
  const [hh, mm] = t.split(':').map(Number);
  const ampm = hh >= 12 ? 'pm' : 'am';
  const hour = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return mm === 0 ? `${hour}${ampm}` : `${hour}:${String(mm).padStart(2, '0')}${ampm}`;
};

const fmtDayHours = (d: DayHours): string => {
  if (!d.open) return 'Closed';
  if (!d.openTime || !d.closeTime) return 'Open';
  return `${fmtTime(d.openTime)}–${fmtTime(d.closeTime)}`;
};

// ─── DiffCard ─────────────────────────────────────────────────────────────────

function DiffCard({ entry }: { entry: DiffEntry }) {
  const { t } = useTranslation();

  const card: React.CSSProperties = {
    background: '#f9fafb',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  };
  const lbl: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-muted)',
    marginBottom: 6,
  };
  const removedStyle: React.CSSProperties = { color: '#b91c1c', textDecoration: 'line-through', opacity: 0.8 };
  const addedStyle: React.CSSProperties   = { background: '#dcfce7', color: '#166534', borderRadius: 2, padding: '0 1px', fontWeight: 600 };

  // ── Tags ──
  if (entry.kind === 'tags') {
    return (
      <div style={card}>
        <div style={lbl}>{t('panel.tagsLabel')}</div>
        {entry.removed.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: entry.added.length > 0 ? 6 : 0 }}>
            {entry.removed.map(tag => (
              <span key={tag} style={{
                background: TAG_CONFIG[tag].bgColor, color: TAG_CONFIG[tag].color,
                padding: '2px 7px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                opacity: 0.55, textDecoration: 'line-through',
              }}>
                {TAG_CONFIG[tag].icon} {t(`tags.${tag}`)}
              </span>
            ))}
          </div>
        )}
        {entry.added.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {entry.added.map(tag => (
              <span key={tag} style={{
                background: TAG_CONFIG[tag].bgColor, color: TAG_CONFIG[tag].color,
                padding: '2px 7px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${TAG_CONFIG[tag].color}`,
              }}>
                + {TAG_CONFIG[tag].icon} {t(`tags.${tag}`)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Hours ──
  if (entry.kind === 'hours') {
    return (
      <div style={card}>
        <div style={lbl}>{t('addModal.hoursLabel')}</div>
        <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {entry.days.map(({ day, from, to }) => (
              <tr key={day} style={{ lineHeight: '1.9' }}>
                <td style={{ width: 36, fontWeight: 700, fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase' }}>{day}</td>
                <td style={{ paddingRight: 6 }}><InlineDiff tokens={wordDiff(from, to)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Wi-Fi networks ──
  if (entry.kind === 'wifi') {
    return (
      <div style={card}>
        <div style={lbl}>{t('wifi.networksLabel')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.changes.map((ch, i) => {
            if (ch.kind === 'removed') {
              return (
                <div key={i} style={{ fontSize: 13 }}>
                  <span style={{ ...removedStyle, fontWeight: 600 }}>{ch.net.ssid}</span>
                  <span style={{ color: 'var(--color-muted)', marginLeft: 6, fontSize: 12 }}>
                    {t(`wifi.type.${ch.net.passwordType}`)}
                  </span>
                </div>
              );
            }
            if (ch.kind === 'added') {
              return (
                <div key={i} style={{ fontSize: 13 }}>
                  <mark style={{ ...addedStyle, fontWeight: 600 }}>+ {ch.net.ssid}</mark>
                  <span style={{ color: 'var(--color-muted)', marginLeft: 6, fontSize: 12 }}>
                    {t(`wifi.type.${ch.net.passwordType}`)}
                  </span>
                </div>
              );
            }
            // changed — show SSID unchanged, then what specifically changed
            const typeChanged = ch.from.passwordType !== ch.to.passwordType;
            const passChanged = ch.from.password !== ch.to.password;
            return (
              <div key={i} style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{ch.ssid}</div>
                {typeChanged && (
                  <div style={{ fontSize: 12 }}>
                    <del style={removedStyle}>{t(`wifi.type.${ch.from.passwordType}`)}</del>
                    {' → '}
                    <mark style={addedStyle}>{t(`wifi.type.${ch.to.passwordType}`)}</mark>
                  </div>
                )}
                {passChanged && (ch.from.password !== undefined || ch.to.password !== undefined) && (
                  <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    <InlineDiff tokens={wordDiff(ch.from.password ?? '', ch.to.password ?? '')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Simple (text fields) — word-level diff ──
  const tokens = wordDiff(entry.from, entry.to);
  const isLong = (entry.from + entry.to).length > 80;

  if (!isLong) {
    return (
      <div style={card}>
        <div style={lbl}>{entry.label}</div>
        <div style={{ fontSize: 13 }}>
          <InlineDiff tokens={tokens} />
        </div>
      </div>
    );
  }

  // Stacked before/after for longer text — show each with only its
  // relevant changes highlighted (same tokens shown plain in both).
  const beforeTokens = tokens.filter(t => t.type !== 'added');
  const afterTokens  = tokens.filter(t => t.type !== 'removed');
  const miniLbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginRight: 8, flexShrink: 0, letterSpacing: '0.04em' };

  return (
    <div style={card}>
      <div style={lbl}>{entry.label}</div>
      <div style={{ fontSize: 13, display: 'flex', marginBottom: 5 }}>
        <span style={miniLbl}>Before</span>
        <span>
          {beforeTokens.map((tok, i) =>
            tok.type === 'same'
              ? <span key={i}>{tok.text}</span>
              : <del key={i} style={removedStyle}>{tok.text}</del>
          )}
        </span>
      </div>
      <div style={{ fontSize: 13, display: 'flex' }}>
        <span style={miniLbl}>After</span>
        <span>
          {afterTokens.map((tok, i) =>
            tok.type === 'same'
              ? <span key={i}>{tok.text}</span>
              : <mark key={i} style={addedStyle}>{tok.text}</mark>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Panel sub-components ─────────────────────────────────────────────────────

interface Props {
  resource: Resource;
  onClose: () => void;
  onAddComment: (resourceId: string, text: string) => void;
  onUpdateResource: (resource: Resource) => void;
}

function DirectionsMenu({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = `directions-menu-${lat}-${lng}`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const encoded = encodeURIComponent(name);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encoded}`;
  const appleUrl  = `https://maps.apple.com/?daddr=${lat},${lng}&q=${encoded}`;

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button className="btn-directions" onClick={() => setOpen(o => !o)}
        aria-haspopup="true" aria-expanded={open} aria-controls={menuId}>
        <Navigation size={15} aria-hidden="true" /> {t('panel.directions')} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id={menuId} role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 10,
        }}>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', textDecoration: 'none',
              color: 'var(--color-text)', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>
            <img src="https://www.gstatic.com/images/branding/product/1x/maps_24dp.png" alt="" width={20} height={20}
              style={{ borderRadius: 4, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            {t('panel.googleMaps')}
          </a>
          <a href={appleUrl} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', textDecoration: 'none',
              color: 'var(--color-text)', fontSize: 14, fontWeight: 600 }}>
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🍎</span>
            {t('panel.appleMaps')}
          </a>
        </div>
      )}
    </div>
  );
}

function WifiNetworkRow({ network }: { network: WifiNetwork }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <span style={{ fontWeight: 600, fontSize: 14 }}>
        {network.ssid || <em style={{ color: 'var(--color-muted)', fontStyle: 'normal' }}>Unnamed network</em>}
      </span>
      {network.passwordType === 'password' ? (
        <div style={{ marginTop: 2, height: 22, display: 'flex', alignItems: 'center' }}>
          {revealed ? (
            <span onClick={() => setRevealed(false)} title={t('wifi.hidePassword')}
              style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-text)', cursor: 'pointer', lineHeight: 1 }}>
              {network.password || '—'}
            </span>
          ) : (
            <button type="button" onClick={() => setRevealed(true)} aria-label={t('wifi.showPassword')}
              style={{ display: 'inline-flex', alignItems: 'center', background: '#111', color: '#fff',
                border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 12, lineHeight: 1, cursor: 'pointer', userSelect: 'none' }}>
              {t('wifi.showPassword')}
            </button>
          )}
        </div>
      ) : network.passwordType !== 'unknown' ? (
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 1 }}>
          {t(`wifi.type.${network.passwordType}`)}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResourcePanel({ resource, onClose, onAddComment, onUpdateResource }: Props) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [votes, setVotes] = useState<Record<string, 'accurate' | 'outdated'>>({});
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<Resource['tags']>([]);
  const [editPinLat, setEditPinLat] = useState(0);
  const [editPinLng, setEditPinLng] = useState(0);
  const [editResolvedAddress, setEditResolvedAddress] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<HoursValue>({ ...DEFAULT_HOURS });
  const [editDirections, setEditDirections] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWifiNetworks, setEditWifiNetworks] = useState<WifiNetwork[]>([]);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmState, setConfirmState] = useState<{ resource: Resource; diff: DiffEntry[] } | null>(null);

  // Reverse-geocode edit pin whenever it moves (debounced 900 ms)
  useEffect(() => {
    if (!editing) return;
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(editPinLat, editPinLng);
      setEditResolvedAddress(addr);
    }, 900);
    return () => { if (geocodeTimer.current) clearTimeout(geocodeTimer.current); };
  }, [editing, editPinLat, editPinLng]);

  useEffect(() => {
    setEditing(false);
    setConfirmState(null);
    setCommentText('');
  }, [resource.id]);

  const handleVote = (id: string, choice: 'accurate' | 'outdated') => {
    setVotes(prev => {
      if (prev[id] === choice) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: choice };
    });
  };

  const handlePostNote = () => {
    if (!commentText.trim()) return;
    onAddComment(resource.id, commentText.trim());
    setCommentText('');
  };

  const startEdit = () => {
    setEditName(resource.name);
    setEditTags([...resource.tags]);
    setEditPinLat(resource.lat);
    setEditPinLng(resource.lng);
    setEditResolvedAddress(resource.address ?? null);
    setEditHours(parseHoursString(resource.hours));
    setEditDirections(resource.directions ?? '');
    setEditDescription(resource.description ?? '');
    setEditWifiNetworks(resource.wifiNetworks ? [...resource.wifiNetworks] : []);
    setConfirmState(null);
    setEditing(true);
  };

  const cancelEdit = () => { setConfirmState(null); setEditing(false); };

  const isDirty = (() => {
    if (!editing) return false;
    if (editName.trim() !== resource.name) return true;
    if ([...editTags].sort().join() !== [...resource.tags].sort().join()) return true;
    if (Math.abs(editPinLat - resource.lat) > 1e-7 || Math.abs(editPinLng - resource.lng) > 1e-7) return true;
    if ((hoursToString(editHours) || undefined) !== resource.hours) return true;
    if (editDirections.trim() !== (resource.directions ?? '')) return true;
    if (editDescription.trim() !== (resource.description ?? '')) return true;
    const fw = editWifiNetworks.filter(n => n.ssid.trim());
    if (JSON.stringify(fw) !== JSON.stringify(resource.wifiNetworks ?? [])) return true;
    return false;
  })();

  const handleSaveClick = () => {
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const diff: DiffEntry[] = [];

    if (editName.trim() !== resource.name)
      diff.push({ kind: 'simple', label: t('addModal.nameLabel'), from: resource.name, to: editName.trim() });

    const added   = editTags.filter(tag => !resource.tags.includes(tag));
    const removed = resource.tags.filter(tag => !editTags.includes(tag));
    if (added.length > 0 || removed.length > 0)
      diff.push({ kind: 'tags', added, removed });

    const pinMoved = Math.abs(editPinLat - resource.lat) > 1e-7 || Math.abs(editPinLng - resource.lng) > 1e-7;
    if (pinMoved) {
      const fromAddr = resource.address ?? `${resource.lat.toFixed(5)}, ${resource.lng.toFixed(5)}`;
      const toAddr   = editResolvedAddress ?? `${editPinLat.toFixed(5)}, ${editPinLng.toFixed(5)}`;
      diff.push({ kind: 'simple', label: t('addModal.locationLabel'), from: fromAddr, to: toAddr });
    }

    const newHoursStr = hoursToString(editHours) || undefined;
    if (newHoursStr !== resource.hours) {
      const oldParsed = parseHoursString(resource.hours);
      if (oldParsed.mode !== 'custom' || editHours.mode !== 'custom') {
        const fmtMode = (h: HoursValue) =>
          h.mode === 'always' ? '24/7' : h.mode === 'closed' ? 'Closed' : hoursToString(h) || '—';
        diff.push({ kind: 'simple', label: t('addModal.hoursLabel'), from: resource.hours ?? '—', to: fmtMode(editHours) });
      } else {
        const changedDays = DAY_LABELS.map((day, idx) => {
          const o = oldParsed.days[idx], n = editHours.days[idx];
          if (o.open === n.open && o.openTime === n.openTime && o.closeTime === n.closeTime) return null;
          return { day, from: fmtDayHours(o), to: fmtDayHours(n) };
        }).filter((d): d is { day: string; from: string; to: string } => d !== null);
        if (changedDays.length > 0) diff.push({ kind: 'hours', days: changedDays });
      }
    }

    if (editDirections.trim() !== (resource.directions ?? ''))
      diff.push({ kind: 'simple', label: t('addModal.directionsLabel'),
        from: resource.directions || '—', to: editDirections.trim() || '—' });

    if (editDescription.trim() !== (resource.description ?? ''))
      diff.push({ kind: 'simple', label: t('addModal.descriptionLabel'),
        from: resource.description || '—', to: editDescription.trim() || '—' });

    const fw = editWifiNetworks.filter(n => n.ssid.trim());
    if (JSON.stringify(fw) !== JSON.stringify(resource.wifiNetworks ?? [])) {
      const changes = diffWifiNetworks(resource.wifiNetworks ?? [], fw);
      if (changes.length > 0) diff.push({ kind: 'wifi', changes });
    }

    const newAddress = pinMoved
      ? (editResolvedAddress ?? `${editPinLat.toFixed(5)}, ${editPinLng.toFixed(5)}`)
      : resource.address;

    const updated: Resource = {
      ...resource,
      name: editName.trim() || resource.name,
      tags: editTags.length > 0 ? editTags : resource.tags,
      lat: editPinLat,
      lng: editPinLng,
      address: newAddress,
      hours: newHoursStr,
      directions: editDirections.trim() || undefined,
      description: editDescription.trim() || undefined,
      wifiNetworks: fw.length > 0 ? fw : undefined,
    };

    setConfirmState({ resource: updated, diff });
  };

  const handleConfirmSave = () => {
    if (!confirmState) return;
    onUpdateResource(confirmState.resource);
    setConfirmState(null);
    setEditing(false);
  };

  const toggleEditTag = (tag: Resource['tags'][number]) =>
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const isAvoid = resource.tags.includes('avoid');

  return (
    <div className={`resource-panel${editing ? ' resource-panel--editing' : ''}`} role="complementary" aria-label={resource.name}>
      <div className="panel-drag-handle" aria-hidden="true" />

      {editing ? (
        <div className="panel-scroll">
          <div className="panel-header">
            <h2 className="panel-title">{confirmState ? t('panel.reviewTitle') : t('panel.editTitle')}</h2>
            <button className="panel-close" onClick={onClose} aria-label={t('panel.close')}>✕</button>
          </div>

          {confirmState ? (
            <div style={{ paddingBottom: 16 }}>
              {confirmState.diff.map((entry, i) => <DiffCard key={i} entry={entry} />)}
            </div>
          ) : (
            <div className="panel-edit-form">
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">{t('addModal.nameLabel')}</label>
                <input id="edit-name" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>

              {/* Tags */}
              <div className="form-group">
                <span className="form-label" id="edit-tags-label">{t('addModal.typeLabel')}</span>
                <div className="tag-checkboxes" role="group" aria-labelledby="edit-tags-label">
                  {ALL_TAGS.map(tag => {
                    const cfg = TAG_CONFIG[tag];
                    const checked = editTags.includes(tag);
                    return (
                      <label key={tag} className={`tag-checkbox ${checked ? 'checked' : ''}`}
                        style={checked ? { background: cfg.bgColor, borderColor: cfg.color, color: cfg.color } : {}}>
                        <input type="checkbox" checked={checked} onChange={() => toggleEditTag(tag)}
                          aria-label={`${cfg.icon} ${t(`tags.${tag}`)}`} />
                        <span aria-hidden="true">{cfg.icon}</span>
                        {t(`tags.${tag}`)}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Location — pin picker */}
              <div className="form-group">
                <span className="form-label">{t('addModal.locationLabel')}</span>
                <div className="drop-pin-container">
                  <div className="drop-pin-hint">
                    <span aria-hidden="true">✅</span> {t('addModal.dropPinPlaced')}
                  </div>
                  <div className="drop-pin-map">
                    <MapContainer center={[editPinLat, editPinLng]} zoom={15}
                      style={{ height: '100%', width: '100%' }} zoomControl attributionControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onPin={(lat, lng) => { setEditPinLat(lat); setEditPinLng(lng); }} />
                      <FlyToPinEffect lat={editPinLat} lng={editPinLng} />
                      <Marker position={[editPinLat, editPinLng]} icon={dropPinIcon} draggable
                        eventHandlers={{ dragend: e => {
                          const ll = (e.target as L.Marker).getLatLng();
                          setEditPinLat(ll.lat); setEditPinLng(ll.lng);
                        }}} />
                    </MapContainer>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <button type="button" className="btn-locate"
                        onClick={() => navigator.geolocation?.getCurrentPosition(p => {
                          setEditPinLat(p.coords.latitude); setEditPinLng(p.coords.longitude);
                        })} title={t('addModal.useMyLocation')}>
                        <span aria-hidden="true">📍</span>
                        <span aria-hidden="true">{t('addModal.useMyLocation')}</span>
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        {editPinLat.toFixed(5)}, {editPinLng.toFixed(5)}
                      </span>
                    </div>
                    {editResolvedAddress && (
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', paddingLeft: 2 }}>
                        {editResolvedAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Directions */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-directions">{t('addModal.directionsLabel')}</label>
                <input id="edit-directions" className="form-input"
                  placeholder={t('addModal.directionsPlaceholder')}
                  value={editDirections} onChange={e => setEditDirections(e.target.value)} />
              </div>

              {/* Hours */}
              <div className="form-group">
                <span className="form-label">{t('addModal.hoursLabel')}</span>
                <HoursPicker value={editHours} onChange={setEditHours} />
              </div>

              {/* Wi-Fi */}
              {editTags.includes('wifi') && (
                <div className="form-group">
                  <span className="form-label">{t('wifi.networksLabel')}</span>
                  <WifiNetworkPicker value={editWifiNetworks} onChange={setEditWifiNetworks} />
                </div>
              )}

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-description">{t('addModal.descriptionLabel')}</label>
                <textarea id="edit-description" className="form-textarea"
                  placeholder={t('addModal.descriptionPlaceholder')}
                  value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── View mode ── */
        <div className="panel-scroll">
          <div className="panel-header">
            <h2 className="panel-title">{resource.name}</h2>
            <button className="panel-close" onClick={onClose} aria-label={t('panel.close')}>✕</button>
          </div>

          {resource.verified && (
            <div className="badge-verified" style={{ marginBottom: 10 }}>
              ✓ {t('panel.communityVerified')}
            </div>
          )}

          <div className="panel-tags" aria-label="Resource types">
            {resource.tags.map(tag => {
              const cfg = TAG_CONFIG[tag];
              return (
                <span key={tag} className="tag-badge" style={{ background: cfg.bgColor, color: cfg.color }}>
                  <span aria-hidden="true">{cfg.icon}</span> {t(`tags.${tag}`)}
                </span>
              );
            })}
          </div>

          <div className="panel-directions-wrap">
            <DirectionsMenu lat={resource.lat} lng={resource.lng} name={resource.name} />
          </div>

          <dl className="panel-meta">
            {resource.address && (
              <div className="panel-meta-row">
                <span className="panel-meta-icon" aria-hidden="true">📍</span>
                <dd className="panel-meta-text">{resource.address}</dd>
              </div>
            )}
            {resource.directions && (
              <div className="panel-meta-row">
                <span className="panel-meta-icon" aria-hidden="true">↪</span>
                <dd className="panel-meta-text">{resource.directions}</dd>
              </div>
            )}
            {resource.hours && (
              <div className="panel-meta-row">
                <span className="panel-meta-icon" aria-hidden="true">🕐</span>
                <dd className="panel-meta-text">{resource.hours}</dd>
              </div>
            )}
            {resource.wifiNetworks && resource.wifiNetworks.length > 0 && (
              <div className="panel-meta-row" style={{ alignItems: 'flex-start' }}>
                <span className="panel-meta-icon" aria-hidden="true">🛜</span>
                <dd className="panel-meta-text" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resource.wifiNetworks.map((net, i) => <WifiNetworkRow key={i} network={net} />)}
                </dd>
              </div>
            )}
            <div className="panel-meta-row">
              <span className="panel-meta-icon" aria-hidden="true">📅</span>
              <dd className="panel-meta-text" style={{ color: 'var(--color-muted)' }}>
                {t('panel.added', { date: resource.addedAt })}
              </dd>
            </div>
          </dl>

          {resource.description && (
            <div className="panel-description"
              style={isAvoid ? { background: '#fef2f2', borderLeft: '3px solid #dc2626' } : {}}>
              {resource.description}
            </div>
          )}

          <div className="divider" />

          <h3 className="section-label">
            {t('panel.communityNotes', { count: resource.comments.length })}
          </h3>
          {resource.comments.length > 0 ? (
            <div className="comments-list">
              {resource.comments.map(c => {
                const myVote = votes[c.id];
                const accurateCount = (c.accuracyVotes?.accurate ?? 0) + (myVote === 'accurate' ? 1 : 0);
                const outdatedCount = (c.accuracyVotes?.outdated ?? 0) + (myVote === 'outdated' ? 1 : 0);
                return (
                  <div key={c.id} className="comment-card">
                    <div>{c.text}</div>
                    <div className="comment-meta">{c.addedAt}</div>
                    <div className="comment-vote-bar">
                      <button className={`comment-vote-btn comment-vote-btn--accurate${myVote === 'accurate' ? ' selected' : ''}`}
                        onClick={() => handleVote(c.id, 'accurate')} aria-pressed={myVote === 'accurate'}>
                        ✓ {t('panel.stillAccurate')}{accurateCount > 0 ? ` · ${accurateCount}` : ''}
                      </button>
                      <button className={`comment-vote-btn comment-vote-btn--outdated${myVote === 'outdated' ? ' selected' : ''}`}
                        onClick={() => handleVote(c.id, 'outdated')} aria-pressed={myVote === 'outdated'}>
                        ⚠ {t('panel.outdatedOrWrong')}{outdatedCount > 0 ? ` · ${outdatedCount}` : ''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 10 }}>{t('panel.noNotes')}</p>
          )}

          <label htmlFor="comment-input" className="sr-only">{t('panel.addNotePlaceholder')}</label>
          <textarea id="comment-input" className="comment-input"
            placeholder={t('panel.addNotePlaceholder')}
            value={commentText} onChange={e => setCommentText(e.target.value)} />
          <button className="btn btn-outline btn-full btn-sm" onClick={handlePostNote}
            disabled={!commentText.trim()} style={{ marginBottom: 8, opacity: commentText.trim() ? 1 : 0.5 }}
            aria-disabled={!commentText.trim()}>
            {t('panel.postNote')}
          </button>

          <div className="divider" />
          <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 4 }}>
            {t('panel.editPrompt')}
          </p>
        </div>
      )}

      {/* Footer */}
      {editing ? (
        <div className="panel-actions">
          <button className="btn-edit-panel"
            onClick={confirmState ? () => setConfirmState(null) : cancelEdit}>
            {confirmState ? t('panel.confirmGoBack') : t('panel.cancelEdit')}
          </button>
          {confirmState ? (
            <button className="btn-directions" onClick={handleConfirmSave}>{t('panel.confirmSave')}</button>
          ) : (
            <button className="btn-directions" onClick={handleSaveClick}
              disabled={!isDirty || editTags.length === 0}
              style={{ opacity: isDirty && editTags.length > 0 ? 1 : 0.55 }}>
              {t('panel.saveEdit')}
            </button>
          )}
        </div>
      ) : (
        <div className="panel-actions">
          <button className="btn-edit-panel" onClick={startEdit} aria-label={t('panel.edit')}>
            <span aria-hidden="true">✏️</span> {t('panel.edit')}
          </button>
          <button className="btn-edit-panel"
            style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
            aria-label={t('panel.report')} title={t('panel.report')}>
            🚩
          </button>
        </div>
      )}
    </div>
  );
}
