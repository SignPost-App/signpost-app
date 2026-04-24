import { useState, useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';

interface Props {
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

export default function AddResourceModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<ResourceTag[]>([]);
  const [locationMode, setLocationMode] = useState<'address' | 'coords'>('address');
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const toggleTag = (tag: ResourceTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(tk => tk !== tag) : [...prev, tag]
    );
  };

  // Focus first element when modal opens
  useEffect(() => {
    const first = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    first?.focus();
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <span id={titleId} className="modal-title">{t('addModal.title')}</span>
          <button
            className="modal-close"
            onClick={onClose}
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
              required
              aria-required="true"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <span className="form-label" id="tags-label">
              {t('addModal.typeLabel')} *
            </span>
            <div
              className="tag-checkboxes"
              role="group"
              aria-labelledby="tags-label"
            >
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
                />
                <button className="btn-locate" title={t('addModal.useMyLocation')}>
                  <span aria-hidden="true">📍</span>
                  <span className="sr-only">{t('addModal.useMyLocation')}</span>
                  <span aria-hidden="true">{t('addModal.useMyLocation')}</span>
                </button>
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
                role="img"
                aria-label={t('addModal.dropPinHint')}
              >
                <span aria-hidden="true">📍</span> {t('addModal.dropPinHint')}
              </div>
            )}
            <div className="form-hint">{t('addModal.locationTip')}</div>
          </div>

          {/* Hours */}
          <div className="form-group">
            <label className="form-label" htmlFor="resource-hours">
              {t('addModal.hoursLabel')}
            </label>
            <input
              id="resource-hours"
              className="form-input"
              placeholder={t('addModal.hoursPlaceholder')}
            />
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
            />
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {t('addModal.disclaimer')}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            {t('addModal.cancel')}
          </button>
          <button className="btn-submit">
            {t('addModal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
