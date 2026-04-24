import { ALL_TAGS, ResourceTag, TAG_CONFIG } from '../types';

interface Props {
  activeFilters: ResourceTag[];
  onFilterChange: (filters: ResourceTag[]) => void;
}

export default function FilterBar({ activeFilters, onFilterChange }: Props) {
  const toggle = (tag: ResourceTag) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(f => f !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  return (
    <div className="filter-bar">
      <div className="filter-chips">
        <button
          className={`filter-chip ${activeFilters.length === 0 ? 'active-all' : ''}`}
          onClick={() => onFilterChange([])}
        >
          All
        </button>
        {ALL_TAGS.map(tag => {
          const cfg = TAG_CONFIG[tag];
          const active = activeFilters.includes(tag);
          return (
            <button
              key={tag}
              className="filter-chip"
              onClick={() => toggle(tag)}
              style={active ? {
                background: cfg.bgColor,
                borderColor: cfg.color,
                color: cfg.color,
              } : {}}
            >
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
