import { useTranslation } from 'react-i18next';
import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';

interface Props {
  activeFilters: ResourceTag[];
  onFilterChange: (filters: ResourceTag[]) => void;
}

export default function FilterBar({ activeFilters, onFilterChange }: Props) {
  const { t } = useTranslation();

  const toggle = (tag: ResourceTag) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(f => f !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  return (
    <nav className="filter-bar" aria-label="Resource filters">
      <div className="filter-chips" role="group" aria-label="Resource filters">
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
      </div>
    </nav>
  );
}
