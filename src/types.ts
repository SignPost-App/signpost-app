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

export interface DayHours {
  open: boolean;
  openTime: string;  // "08:00"
  closeTime: string; // "17:00"
}

export interface HoursValue {
  mode: 'always' | 'closed' | 'custom';
  days: DayHours[]; // [mon, tue, wed, thu, fri, sat, sun]
}

const mkDay = (open: boolean, openTime = '08:00', closeTime = '17:00'): DayHours =>
  ({ open, openTime, closeTime });

// Mon–Fri 8–5, Sat–Sun closed — sensible starting point for Edit mode
export const DEFAULT_HOURS: HoursValue = {
  mode: 'custom',
  days: [mkDay(true), mkDay(true), mkDay(true), mkDay(true), mkDay(true),
         mkDay(false, '10:00', '15:00'), mkDay(false, '10:00', '15:00')],
};

// All days blank — used as the starting point for a new Add form
export const EMPTY_HOURS: HoursValue = {
  mode: 'custom',
  days: Array.from({ length: 7 }, () => mkDay(false)),
};

export function hoursToString(h: HoursValue): string {
  if (h.mode === 'always') return '24/7';
  if (h.mode === 'closed') return 'Closed';

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fmt = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    const ampm = hh >= 12 ? 'pm' : 'am';
    const hour = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return mm === 0 ? `${hour}${ampm}` : `${hour}:${String(mm).padStart(2, '0')}${ampm}`;
  };

  const openDays = h.days
    .map((d, i) => d.open ? { i, openTime: d.openTime, closeTime: d.closeTime } : null)
    .filter((d): d is { i: number; openTime: string; closeTime: string } => d !== null);

  if (openDays.length === 0) return '';

  // Group consecutive days that share the same open/close times
  const groups: { start: number; end: number; openTime: string; closeTime: string }[] = [];
  for (const day of openDays) {
    const last = groups[groups.length - 1];
    if (last && last.end === day.i - 1
        && last.openTime === day.openTime && last.closeTime === day.closeTime) {
      last.end = day.i;
    } else {
      groups.push({ start: day.i, end: day.i, openTime: day.openTime, closeTime: day.closeTime });
    }
  }

  return groups.map(g => {
    const span = g.end - g.start;
    const dayStr = span === 0
      ? DAY_LABELS[g.start]
      : span === 1
        ? `${DAY_LABELS[g.start]}, ${DAY_LABELS[g.end]}`
        : `${DAY_LABELS[g.start]}–${DAY_LABELS[g.end]}`;
    return `${dayStr} ${fmt(g.openTime)}–${fmt(g.closeTime)}`;
  }).join(', ');
}

export function parseHoursString(s: string | undefined): HoursValue {
  if (!s) return { ...EMPTY_HOURS, days: Array.from({ length: 7 }, () => mkDay(false)) };
  const lower = s.toLowerCase().trim();
  if (lower.includes('24/7') || lower === 'always open') {
    return { mode: 'always', days: Array.from({ length: 7 }, () => mkDay(true, '00:00', '23:59')) };
  }
  if (lower === 'closed' || lower === 'permanently closed') {
    return { mode: 'closed', days: Array.from({ length: 7 }, () => mkDay(false)) };
  }

  // Extract first pair of am/pm times
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
  const times: number[] = [];
  let m;
  while ((m = timeRegex.exec(s)) !== null) {
    let hh = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    const ap = m[3].toLowerCase();
    if (ap === 'pm' && hh !== 12) hh += 12;
    if (ap === 'am' && hh === 12) hh = 0;
    times.push(hh * 60 + min);
  }
  const toTime = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const openTime = times.length >= 1 ? toTime(times[0]) : '08:00';
  const closeTime = times.length >= 2 ? toTime(times[1]) : '17:00';

  const openFlags = [false, false, false, false, false, false, false];
  if (lower.includes('daily') || lower.includes('mon–sun') || lower.includes('every day')) {
    openFlags.fill(true);
  } else if (lower.includes('mon–fri') || lower.includes('mon-fri') || lower.includes('weekdays')) {
    openFlags[0] = openFlags[1] = openFlags[2] = openFlags[3] = openFlags[4] = true;
  } else if (lower.includes('sat') && lower.includes('sun') && !lower.includes('mon')) {
    openFlags[5] = openFlags[6] = true;
  } else {
    openFlags[0] = openFlags[1] = openFlags[2] = openFlags[3] = openFlags[4] = true;
  }
  return { mode: 'custom', days: openFlags.map(open => mkDay(open, openTime, closeTime)) };
}

export interface AddDraft {
  name: string;
  selectedTags: ResourceTag[];
  locationMode: 'address' | 'coords';
  address: string;
  pinLat: number | null;
  pinLng: number | null;
  hours: HoursValue;
  description: string;
}
