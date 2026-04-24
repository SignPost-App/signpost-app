import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface Props {
  activeFilters: ResourceTag[];
  onFilterChange: (filters: ResourceTag[]) => void;
}

type PanelState = 'closed' | 'open' | 'closing';
const CLOSE_MS = 180;

export default function FilterBar({ activeFilters, onFilterChange }: Props) {
  const { t } = useTranslation();
  const [overflowing, setOverflowing] = useState(false);
  const [panel, setPanel] = useState<PanelState>('closed');
  const rowRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  // Mirrors (panel !== 'closed') so the ResizeObserver callback can skip
  // measurements while the row is display:none.
  const rowHiddenRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (tag: ResourceTag) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(f => f !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  const open = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    rowHiddenRef.current = true;
    setPanel('open');
  };

  const close = () => {
    if (panel === 'closing') return;
    setPanel('closing');
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      rowHiddenRef.current = false;
      setPanel('closed');
    }, CLOSE_MS);
  };

  // Prevent state update on unmounted component if timer is still pending.
  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  // Detect overflow. Row is display:none while panel is visible — skip those
  // zero-width measurements via rowHiddenRef.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!rowHiddenRef.current) {
        setOverflowing(el.scrollWidth > el.clientWidth + 2);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useOutsideClick(barRef, close, panel !== 'closed');

  const panelVisible = panel !== 'closed';

  const chipList = (
    <>
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
    </>
  );

  return (
    <nav ref={barRef} className="filter-bar" aria-label="Resource filters">
      {/*
        Always in DOM so rowRef stays stable for the ResizeObserver.
        Hidden (display:none) while the panel is open or closing so it takes
        up no space. rowHiddenRef prevents the observer from clearing the
        overflowing flag while the row has no layout.
      */}
      <div
        className="filter-bar-row"
        style={panelVisible ? { display: 'none' } : undefined}
      >
        <div
          ref={rowRef}
          className="filter-chips"
          role="group"
          aria-label="Resource filters"
        >
          {chipList}
        </div>
        {overflowing && (
          <button
            className="filter-chip filter-chip--more"
            onClick={open}
            aria-expanded={false}
          >
            {t('filter.more')}
          </button>
        )}
      </div>

      {panelVisible && (
        <div
          className={`filter-chips-expanded${panel === 'closing' ? ' filter-chips-expanded--closing' : ''}`}
          role="group"
          aria-label="Resource filters"
        >
          {chipList}
          <button className="filter-chip filter-chip--less" onClick={close}>
            {t('filter.less')}
          </button>
        </div>
      )}
    </nav>
  );
}
