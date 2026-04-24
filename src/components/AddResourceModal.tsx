import { useState } from 'react';
import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';

interface Props {
  onClose: () => void;
}

export default function AddResourceModal({ onClose }: Props) {
  const [selectedTags, setSelectedTags] = useState<ResourceTag[]>([]);
  const [locationMode, setLocationMode] = useState<'address' | 'coords'>('address');

  const toggleTag = (tag: ResourceTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add a Resource</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" placeholder="e.g. Community Food Bank" />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Type (select all that apply) *</label>
            <div className="tag-checkboxes">
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
                    <input type="checkbox" checked={checked} onChange={() => toggleTag(tag)} />
                    {cfg.icon} {cfg.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location *</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                className="btn btn-sm"
                style={locationMode === 'address' ? { background: 'var(--color-primary)', color: '#fff', border: 'none' } : { background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                onClick={() => setLocationMode('address')}
              >
                Address
              </button>
              <button
                className="btn btn-sm"
                style={locationMode === 'coords' ? { background: 'var(--color-primary)', color: '#fff', border: 'none' } : { background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                onClick={() => setLocationMode('coords')}
              >
                Drop Pin
              </button>
            </div>
            {locationMode === 'address' ? (
              <div className="location-row">
                <input className="form-input" placeholder="Street address or intersection" />
                <button className="btn-locate" title="Use my current location">📍 Use my location</button>
              </div>
            ) : (
              <div
                style={{
                  height: 120,
                  background: '#e8ecef',
                  borderRadius: 8,
                  border: '1.5px dashed var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-muted)',
                  fontSize: 14,
                }}
              >
                📍 Tap on the map to drop a pin
              </div>
            )}
            <div className="form-hint">Tip: tap "Use my location" if you're standing there.</div>
          </div>

          {/* Hours */}
          <div className="form-group">
            <label className="form-label">Hours / Availability</label>
            <input className="form-input" placeholder="e.g. Mon–Fri 8am–5pm, or 24/7" />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea
              className="form-textarea"
              placeholder="What should people know? No ID required, line gets long, etc."
            />
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            By submitting, you confirm this is accurate information that will help others.
            Do not post harmful, false, or illicit content.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit">Submit Resource</button>
        </div>
      </div>
    </div>
  );
}
