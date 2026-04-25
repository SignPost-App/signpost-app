import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Resource, TAG_CONFIG, ALL_TAGS, HoursValue, DEFAULT_HOURS, parseHoursString, hoursToString } from '../types';
import HoursPicker from './HoursPicker';

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
      <button
        className="btn-directions"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span aria-hidden="true">🧭</span>
        {t('panel.directions')}
        <span aria-hidden="true"> ▾</span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          style={{
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
          }}
        >
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
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
            {t('panel.googleMaps')}
          </a>
          <a
            href={appleUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
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
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🍎</span>
            {t('panel.appleMaps')}
          </a>
        </div>
      )}
    </div>
  );
}

export default function ResourcePanel({ resource, onClose, onAddComment, onUpdateResource }: Props) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [votes, setVotes] = useState<Record<string, 'accurate' | 'outdated'>>({});
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<Resource['tags']>([]);
  const [editAddress, setEditAddress] = useState('');
  const [editHours, setEditHours] = useState<HoursValue>({ ...DEFAULT_HOURS });
  const [editDescription, setEditDescription] = useState('');

  // Reset edit state when switching to a different resource
  useEffect(() => {
    setEditing(false);
    setCommentText('');
  }, [resource.id]);

  const handleVote = (id: string, choice: 'accurate' | 'outdated') => {
    setVotes(prev => {
      if (prev[id] === choice) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
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
    setEditAddress(resource.address ?? '');
    setEditHours(parseHoursString(resource.hours));
    setEditDescription(resource.description ?? '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const updated: Resource = {
      ...resource,
      name: editName.trim() || resource.name,
      tags: editTags.length > 0 ? editTags : resource.tags,
      address: editAddress.trim() || undefined,
      hours: hoursToString(editHours) || undefined,
      description: editDescription.trim() || undefined,
    };
    onUpdateResource(updated);
    setEditing(false);
  };

  const toggleEditTag = (tag: Resource['tags'][number]) => {
    setEditTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const isAvoid = resource.tags.includes('avoid');

  return (
    <div
      className="resource-panel"
      role="complementary"
      aria-label={resource.name}
    >
      <div className="panel-drag-handle" aria-hidden="true" />

      {editing ? (
        /* ---- Edit Mode ---- */
        <div className="panel-scroll">
          <div className="panel-header">
            <h2 className="panel-title">{t('panel.editTitle')}</h2>
            <button
              className="panel-close"
              onClick={onClose}
              aria-label={t('panel.close')}
            >
              ✕
            </button>
          </div>

          <div className="panel-edit-form">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">
                {t('addModal.nameLabel')}
              </label>
              <input
                id="edit-name"
                className="form-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <span className="form-label" id="edit-tags-label">
                {t('addModal.typeLabel')}
              </span>
              <div className="tag-checkboxes" role="group" aria-labelledby="edit-tags-label">
                {ALL_TAGS.map(tag => {
                  const cfg = TAG_CONFIG[tag];
                  const checked = editTags.includes(tag);
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
                        onChange={() => toggleEditTag(tag)}
                        aria-label={`${cfg.icon} ${t(`tags.${tag}`)}`}
                      />
                      <span aria-hidden="true">{cfg.icon}</span>
                      {t(`tags.${tag}`)}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-address">
                {t('addModal.locationLabel')}
              </label>
              <input
                id="edit-address"
                className="form-input"
                placeholder={t('addModal.addressPlaceholder')}
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <span className="form-label">{t('addModal.hoursLabel')}</span>
              <HoursPicker value={editHours} onChange={setEditHours} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-description">
                {t('addModal.descriptionLabel')}
              </label>
              <textarea
                id="edit-description"
                className="form-textarea"
                placeholder={t('addModal.descriptionPlaceholder')}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ---- View Mode ---- */
        <div className="panel-scroll">
          <div className="panel-header">
            <h2 className="panel-title">{resource.name}</h2>
            <button
              className="panel-close"
              onClick={onClose}
              aria-label={t('panel.close')}
            >
              ✕
            </button>
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
                <span
                  key={tag}
                  className="tag-badge"
                  style={{ background: cfg.bgColor, color: cfg.color }}
                >
                  <span aria-hidden="true">{cfg.icon}</span>
                  {t(`tags.${tag}`)}
                </span>
              );
            })}
          </div>

          <dl className="panel-meta">
            {resource.address && (
              <div className="panel-meta-row">
                <span className="panel-meta-icon" aria-hidden="true">📍</span>
                <dd className="panel-meta-text">{resource.address}</dd>
              </div>
            )}
            {resource.hours && (
              <div className="panel-meta-row">
                <span className="panel-meta-icon" aria-hidden="true">🕐</span>
                <dd className="panel-meta-text">{resource.hours}</dd>
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
            <div
              className="panel-description"
              style={isAvoid ? { background: '#fef2f2', borderLeft: '3px solid #dc2626' } : {}}
            >
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
                      <button
                        className={`comment-vote-btn comment-vote-btn--accurate${myVote === 'accurate' ? ' selected' : ''}`}
                        onClick={() => handleVote(c.id, 'accurate')}
                        aria-pressed={myVote === 'accurate'}
                      >
                        ✓ {t('panel.stillAccurate')}{accurateCount > 0 ? ` · ${accurateCount}` : ''}
                      </button>
                      <button
                        className={`comment-vote-btn comment-vote-btn--outdated${myVote === 'outdated' ? ' selected' : ''}`}
                        onClick={() => handleVote(c.id, 'outdated')}
                        aria-pressed={myVote === 'outdated'}
                      >
                        ⚠ {t('panel.outdatedOrWrong')}{outdatedCount > 0 ? ` · ${outdatedCount}` : ''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 10 }}>
              {t('panel.noNotes')}
            </p>
          )}

          <label htmlFor="comment-input" className="sr-only">
            {t('panel.addNotePlaceholder')}
          </label>
          <textarea
            id="comment-input"
            className="comment-input"
            placeholder={t('panel.addNotePlaceholder')}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button
            className="btn btn-outline btn-full btn-sm"
            onClick={handlePostNote}
            disabled={!commentText.trim()}
            style={{ marginBottom: 8, opacity: commentText.trim() ? 1 : 0.5 }}
            aria-disabled={!commentText.trim()}
          >
            {t('panel.postNote')}
          </button>

          <div className="divider" />

          <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 4 }}>
            {t('panel.editPrompt')}
          </p>
        </div>
      )}

      {/* Actions footer */}
      {editing ? (
        <div className="panel-actions">
          <button className="btn-edit-panel" onClick={cancelEdit}>
            {t('panel.cancelEdit')}
          </button>
          <button
            className="btn-directions"
            onClick={saveEdit}
            disabled={editTags.length === 0}
            style={{ opacity: editTags.length > 0 ? 1 : 0.55 }}
          >
            {t('panel.saveEdit')}
          </button>
        </div>
      ) : (
        <div className="panel-actions">
          <DirectionsMenu lat={resource.lat} lng={resource.lng} name={resource.name} />
          <button
            className="btn-edit-panel"
            onClick={startEdit}
            aria-label={t('panel.edit')}
          >
            <span aria-hidden="true">✏️</span> {t('panel.edit')}
          </button>
          <button
            className="btn-edit-panel"
            style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
            aria-label={t('panel.report')}
            title={t('panel.report')}
          >
            🚩
          </button>
        </div>
      )}
    </div>
  );
}
