export type ResourceTag =
  | 'food'
  | 'water'
  | 'shelter'
  | 'bathroom'
  | 'charging'
  | 'shower'
  | 'harm-reduction'
  | 'propane'
  | 'safe-park'
  | 'covered'
  | 'avoid';

export interface TagConfig {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}

export const TAG_CONFIG: Record<ResourceTag, TagConfig> = {
  food:             { icon: '🍎', label: 'Food',          color: '#ea580c', bgColor: '#fff7ed' },
  water:            { icon: '💧', label: 'Water',         color: '#0284c7', bgColor: '#e0f2fe' },
  shelter:          { icon: '🏠', label: 'Shelter',       color: '#7c3aed', bgColor: '#f5f3ff' },
  bathroom:         { icon: '🚻', label: 'Bathroom',      color: '#4b5563', bgColor: '#f3f4f6' },
  charging:         { icon: '🔌', label: 'Charging',      color: '#ca8a04', bgColor: '#fefce8' },
  shower:           { icon: '🚿', label: 'Shower',        color: '#0891b2', bgColor: '#ecfeff' },
  'harm-reduction': { icon: '💊', label: 'Harm Reduction',color: '#db2777', bgColor: '#fdf2f8' },
  propane:          { icon: '🔥', label: 'Propane',       color: '#d97706', bgColor: '#fffbeb' },
  'safe-park':      { icon: '🌳', label: 'Safe Park',     color: '#16a34a', bgColor: '#f0fdf4' },
  covered:          { icon: '☔', label: 'Covered Area',  color: '#2563eb', bgColor: '#eff6ff' },
  avoid:            { icon: '⛔', label: 'AVOID',         color: '#dc2626', bgColor: '#fef2f2' },
};

export const ALL_TAGS: ResourceTag[] = Object.keys(TAG_CONFIG) as ResourceTag[];

export interface Comment {
  id: string;
  text: string;
  addedAt: string;
  accuracyVotes?: { accurate: number; outdated: number };
}

export interface Resource {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tags: ResourceTag[];
  address?: string;
  hours?: string;
  description?: string;
  comments: Comment[];
  addedAt: string;
  verified?: boolean;
}
