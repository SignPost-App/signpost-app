import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface Props {
  activeFilters: ResourceTag[];
  onFilterChange: (filters: ResourceTag[]) => void;
  openNow: boolean;
  onOpenNowChange: (v: boolean) => void;
}

type PanelState = 'closed' | 'open' | 'closing';

export default function FilterBar({ activeFilters, onFilterChange, openNow, onOpenNowChange }: Props) {
  const { t } = useTranslation();
  const [overflowing, setOverflowing] = useState(false);
  const [panel, setPanel] = useState<PanelState>('closed');
  const [openMaxH, setOpenMaxH] = useState(0);
  // closedH: exact height of one chip row. Measured after first paint; 49 is a safe fallback.
  const [closedH, setClosedH] = useState(49);
  // Suppress the max-height transition until after the first measurement paint so
  // the initial closedH → measured-closedH change doesn't play a slide animation.
  const [transitionReady, setTransitionReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

  // Measure the true single-row height from a rendered chip.
  // closedH = 8px top-padding + chipHeight + 5px (partial gap — clips just before row 2 starts)
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const chip = el.querySelector<HTMLElement>('.filter-chip');
    if (chip) {
      // Row 2 starts at: 8 (top pad) + chipH + 6 (gap) = chipH + 14
      // Setting max-height to chipH + 13 clips 1px before row 2 → row 2 fully hidden
      setClosedH(Math.ceil(chip.getBoundingClientRect().height) + 13);
    }
  }, []);

  useEffect(() => {
    setTransitionReady(true);
  }, []);

  const toggle = (tag: ResourceTag) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(f => f !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  const open = () => {
    const el = panelRef.current;
    if (!el) return;
    const chip = el.querySelector<HTMLElement>('.filter-chip');
    // scrollHeight doesn't include Less button, divider, or Open Now (not yet rendered).
    // Extra: Less (chipH + 6 gap) + divider (~26px) + Open Now (chipH + 6 gap) + padding
    const chipH = chip ? Math.ceil(chip.getBoundingClientRect().height) : 33;
    setOpenMaxH(el.scrollHeight + chipH * 2 + 54);
    setPanel('open');
  };

  const close = () => {
    if (panel === 'closed') return;
    setPanel('closing');
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (panel === 'closing' && e.propertyName === 'max-height') setPanel('closed');
  };

  // Detect whether chips wrap past the first row (only meaningful when closed)
  useEffect(() => {
    const el = panelRef.current;
    if (!el || panel !== 'closed') return;
    const check = () => setOverflowing(el.scrollHeight > closedH + 4);
    const obs = new ResizeObserver(check);
    obs.observe(el);
    check();
    return () => obs.disconnect();
  }, [panel, closedH]);

  useOutsideClick(barRef, close, panel !== 'closed');

  // Keep openMaxH accurate while expanded — update whenever the bar width changes
  // (chips wrap more at narrower widths, pushing the Less button off-screen otherwise)
  useEffect(() => {
    if (panel !== 'open') return;
    const el = panelRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    const recalc = () => {
      const chip = el.querySelector<HTMLElement>('.filter-chip');
      const chipH = chip ? Math.ceil(chip.getBoundingClientRect().height) : 33;
      setOpenMaxH(el.scrollHeight + chipH + 8);
    };
    // Delay until after the open animation completes so we don't jump mid-animation
    const timer = setTimeout(recalc, 300);
    const obs = new ResizeObserver(recalc);
    obs.observe(bar);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [panel]);

  const isExpanded = panel === 'open' || panel === 'closing';

  const panelStyle: React.CSSProperties = {
    maxHeight: panel === 'open' ? openMaxH : closedH,
  };
  if (!transitionReady) panelStyle.transition = 'none';
  if (panel === 'closed') panelStyle.paddingRight = 88;

  return (
    <nav ref={barRef} className="filter-bar" aria-label="Resource filters">
      <div className="filter-bar-spacer" style={{ height: closedH }} aria-hidden="true" />

      <div
        ref={panelRef}
        className={`filter-chips-panel${isExpanded ? ' filter-chips-panel--expanded' : ''}`}
        style={panelStyle}
        onTransitionEnd={handleTransitionEnd}
        role="group"
        aria-label="Resource filters"
      >
        <button
          className={`filter-chip ${activeFilters.length === 0 ? 'active-all' : ''}`}
          onClick={() => onFilterChange([])}
          aria-pressed={activeFilters.length === 0}
        >
          {t('filter.all')}
        </button>
        {ALL_TAGS.map(tag => {
          const cfg = TAG_CONFIG[tag];
          const active = activeFilters.includes(tag);
          return (
            <button
              key={tag}
              className="filter-chip"
              onClick={() => toggle(tag)}
              aria-pressed={active}
              style={active ? {
                background: cfg.bgColor,
                borderColor: cfg.color,
                color: cfg.color,
              } : {}}
            >
              <span aria-hidden="true">{cfg.icon}</span>
              {t(`tags.${tag}`)}
            </button>
          );
        })}
        {isExpanded && (
          <>
            <hr className="filter-section-divider" aria-hidden="true" />
            <button
              className="filter-chip filter-chip--open-now"
              onClick={() => onOpenNowChange(!openNow)}
              aria-pressed={openNow}
              style={openNow ? { background: '#059669', borderColor: '#059669', color: '#fff' } : {}}
            >
              🕐 {t('filter.openNow')}
            </button>
            <button className="filter-chip filter-chip--less" onClick={close}>
              {t('filter.less')}
            </button>
          </>
        )}
      </div>

      {panel === 'closed' && (
        <button
          className="filter-chip filter-chip--more"
          onClick={open}
          aria-expanded={false}
        >
          {t('filter.more')}
        </button>
      )}
    </nav>
  );
}
