import { useState, useRef, useEffect } from 'react';
import { Resource, TAG_CONFIG } from '../types';

interface Props {
  resource: Resource;
  onClose: () => void;
}

function DirectionsMenu({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
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
      <button className="btn-directions" onClick={() => setOpen(o => !o)}>
        🧭 Get Directions ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#fff',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          zIndex: 10,
        }}>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '13px 16px',
              textDecoration: 'none',
              color: 'var(--color-text)',
              fontSize: 14,
              fontWeight: 600,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/maps_24dp.png"
              alt=""
              width={20}
              height={20}
              style={{ borderRadius: 4, flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            Open in Google Maps
          </a>
          <a
            href={appleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '13px 16px',
              textDecoration: 'none',
              color: 'var(--color-text)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🍎</span>
            Open in Apple Maps
          </a>
        </div>
      )}
    </div>
  );
}

export default function ResourcePanel({ resource, onClose }: Props) {
  const [commentText, setCommentText] = useState('');
  const isAvoid = resource.tags.includes('avoid');

  return (
    <div className="resource-panel">
      <div className="panel-drag-handle" />
      <div className="panel-scroll">
        {/* Header */}
        <div className="panel-header">
          <h2 className="panel-title">{resource.name}</h2>
          <button className="panel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Verified badge */}
        {resource.verified && (
          <div className="badge-verified" style={{ marginBottom: 10 }}>
            ✓ Community-verified
          </div>
        )}

        {/* Tags */}
        <div className="panel-tags">
          {resource.tags.map(tag => {
            const cfg = TAG_CONFIG[tag];
            return (
              <span
                key={tag}
                className="tag-badge"
                style={{ background: cfg.bgColor, color: cfg.color }}
              >
                {cfg.icon} {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Meta */}
        <div className="panel-meta">
          {resource.address && (
            <div className="panel-meta-row">
              <span className="panel-meta-icon">📍</span>
              <span className="panel-meta-text">{resource.address}</span>
            </div>
          )}
          {resource.hours && (
            <div className="panel-meta-row">
              <span className="panel-meta-icon">🕐</span>
              <span className="panel-meta-text">{resource.hours}</span>
            </div>
          )}
          <div className="panel-meta-row">
            <span className="panel-meta-icon">📅</span>
            <span className="panel-meta-text" style={{ color: 'var(--color-muted)' }}>
              Added {resource.addedAt}
            </span>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <div
            className="panel-description"
            style={isAvoid ? { background: '#fef2f2', borderLeft: '3px solid #dc2626' } : {}}
          >
            {resource.description}
          </div>
        )}

        <div className="divider" />

        {/* Comments */}
        <div className="section-label">Community Notes ({resource.comments.length})</div>
        {resource.comments.length > 0 ? (
          <div className="comments-list">
            {resource.comments.map(c => (
              <div key={c.id} className="comment-card">
                <div>{c.text}</div>
                <div className="comment-meta">{c.addedAt}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 10 }}>
            No notes yet — be the first to add one.
          </p>
        )}

        <textarea
          className="comment-input"
          placeholder="Add a note (hours change, tips, warnings…)"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
        />
        <button
          className="btn btn-outline btn-full btn-sm"
          disabled={!commentText.trim()}
          style={{ marginBottom: 8, opacity: commentText.trim() ? 1 : 0.5 }}
        >
          Post Note
        </button>

        <div className="divider" />

        {/* Edit prompt */}
        <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 4 }}>
          Hours wrong? Location off? Anyone can improve this listing.
        </p>
      </div>

      {/* Actions footer */}
      <div className="panel-actions">
        <DirectionsMenu lat={resource.lat} lng={resource.lng} name={resource.name} />
        <button className="btn-edit-panel">✏️ Edit</button>
        <button
          className="btn-edit-panel"
          style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
          title="Report inaccurate or harmful content"
        >
          🚩
        </button>
      </div>
    </div>
  );
}
