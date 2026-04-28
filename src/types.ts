export type ResourceTag =
  | 'food'
  | 'water'
  | 'shelter'
  | 'bathroom'
  | 'charging'
  | 'wifi'
  | 'shower'
  | 'harm-reduction'
  | 'propane'
  | 'park'
  | 'covered'
  | 'avoid';

export type WifiPasswordType = 'open' | 'password' | 'ask' | 'login' | 'unknown';

export interface WifiNetwork {
  ssid: string;
  passwordType: WifiPasswordType;
  password?: string;
}

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
  wifi:             { icon: '🛜', label: 'Wi-Fi',         color: '#4f46e5', bgColor: '#eef2ff' },
  shower:           { icon: '🚿', label: 'Shower',        color: '#0891b2', bgColor: '#ecfeff' },
  'harm-reduction': { icon: '💊', label: 'Harm Reduction',color: '#db2777', bgColor: '#fdf2f8' },
  propane:          { icon: '🔥', label: 'Propane',       color: '#d97706', bgColor: '#fffbeb' },
  park:             { icon: '🌳', label: 'Park',          color: '#16a34a', bgColor: '#f0fdf4' },
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
  directions?: string;
  description?: string;
  wifiNetworks?: WifiNetwork[];
  comments: Comment[];
  addedAt: string;
  verified?: boolean;
}

export interface DayHours {
  open: boolean;
  openTime: string | null;  // "08:00" or null when not set
  closeTime: string | null;
}

export interface HoursValue {
  mode: 'always' | 'closed' | 'custom';
  days: DayHours[]; // [mon, tue, wed, thu, fri, sat, sun]
}

const mkDay = (open: boolean, openTime: string | null = null, closeTime: string | null = null): DayHours =>
  ({ open, openTime, closeTime });

// Mon–Fri 8–5, Sat–Sun closed — sensible starting point for Edit mode
export const DEFAULT_HOURS: HoursValue = {
  mode: 'custom',
  days: [
    mkDay(true, '08:00', '17:00'), mkDay(true, '08:00', '17:00'),
    mkDay(true, '08:00', '17:00'), mkDay(true, '08:00', '17:00'),
    mkDay(true, '08:00', '17:00'),
    mkDay(false), mkDay(false),
  ],
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
  const fmt = (t: string | null): string | null => {
    if (!t) return null;
    const [hh, mm] = t.split(':').map(Number);
    const ampm = hh >= 12 ? 'pm' : 'am';
    const hour = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return mm === 0 ? `${hour}${ampm}` : `${hour}:${String(mm).padStart(2, '0')}${ampm}`;
  };

  const openDays = h.days
    .map((d, i) => d.open ? { i, openTime: d.openTime, closeTime: d.closeTime } : null)
    .filter((d): d is { i: number; openTime: string | null; closeTime: string | null } => d !== null);

  if (openDays.length === 0) return '';

  // Group consecutive days that share the same open/close times
  const groups: { start: number; end: number; openTime: string | null; closeTime: string | null }[] = [];
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
    const openFmt = fmt(g.openTime);
    const closeFmt = fmt(g.closeTime);
    if (openFmt && closeFmt) return `${dayStr} ${openFmt}–${closeFmt}`;
    return dayStr;
  }).join(', ');
}

export function parseHoursString(s: string | undefined): HoursValue {
  if (!s) return { mode: 'custom', days: Array.from({ length: 7 }, () => mkDay(false)) };
  const lower = s.toLowerCase().trim();
  if (lower.includes('24/7') || lower === 'always open') {
    return { mode: 'always', days: Array.from({ length: 7 }, () => mkDay(true, '00:00', '23:59')) };
  }
  if (lower === 'closed' || lower === 'permanently closed') {
    return { mode: 'closed', days: Array.from({ length: 7 }, () => mkDay(false)) };
  }

  const DAY_MAP: Record<string, number> = {
    mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  };

  const parseTimePart = (t: string): string | null => {
    const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (!m) return null;
    let hh = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    const ap = m[3].toLowerCase();
    if (ap === 'pm' && hh !== 12) hh += 12;
    if (ap === 'am' && hh === 12) hh = 0;
    return `${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const days: DayHours[] = Array.from({ length: 7 }, () => mkDay(false));

  // Match groups like "Mon–Fri 8am–5pm", "Mon 9am–5pm", "Mon, Tue 8am–5pm"
  const groupRegex = /((?:[A-Za-z]+(?:\s*[–\-]\s*[A-Za-z]+|,\s*[A-Za-z]+)?))\s+(\d{1,2}(?::\d{2})?\s*[ap]m)\s*[–\-]\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/gi;

  let matched = false;
  let match;
  while ((match = groupRegex.exec(s)) !== null) {
    matched = true;
    const daySpan = match[1].trim();
    const openT = parseTimePart(match[2]);
    const closeT = parseTimePart(match[3]);

    const rangeMatch = daySpan.match(/^([A-Za-z]+)\s*[–\-]\s*([A-Za-z]+)$/);
    const commaMatch = daySpan.match(/^([A-Za-z]+),\s*([A-Za-z]+)$/);

    if (rangeMatch) {
      const start = DAY_MAP[rangeMatch[1].toLowerCase()];
      const end = DAY_MAP[rangeMatch[2].toLowerCase()];
      if (start !== undefined && end !== undefined && end >= start) {
        for (let i = start; i <= end; i++) {
          days[i] = { open: true, openTime: openT, closeTime: closeT };
        }
      }
    } else if (commaMatch) {
      const d1 = DAY_MAP[commaMatch[1].toLowerCase()];
      const d2 = DAY_MAP[commaMatch[2].toLowerCase()];
      if (d1 !== undefined) days[d1] = { open: true, openTime: openT, closeTime: closeT };
      if (d2 !== undefined) days[d2] = { open: true, openTime: openT, closeTime: closeT };
    } else {
      const d = DAY_MAP[daySpan.toLowerCase()];
      if (d !== undefined) days[d] = { open: true, openTime: openT, closeTime: closeT };
    }
  }

  if (!matched) {
    // Legacy fallback for simple strings without per-day time groups
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
    const times: number[] = [];
    let m2;
    while ((m2 = timeRegex.exec(s)) !== null) {
      let hh = parseInt(m2[1]);
      const min = m2[2] ? parseInt(m2[2]) : 0;
      const ap = m2[3].toLowerCase();
      if (ap === 'pm' && hh !== 12) hh += 12;
      if (ap === 'am' && hh === 12) hh = 0;
      times.push(hh * 60 + min);
    }
    const toTime = (mins: number): string =>
      `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    const openTime = times.length >= 1 ? toTime(times[0]) : null;
    const closeTime = times.length >= 2 ? toTime(times[1]) : null;

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
    openFlags.forEach((open, i) => {
      if (open) days[i] = { open: true, openTime, closeTime };
    });
  }

  return { mode: 'custom', days };
}

export function isOpenNow(resource: Resource): boolean {
  if (!resource.hours) return true;
  const parsed = parseHoursString(resource.hours);
  if (parsed.mode === 'always') return true;
  if (parsed.mode === 'closed') return false;

  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  const day = parsed.days[dayIndex];
  if (!day.open) return false;
  if (!day.openTime || !day.closeTime) return true; // open but hours unknown

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = day.openTime.split(':').map(Number);
  const [ch, cm] = day.closeTime.split(':').map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;

  if (closeMins <= openMins) {
    return currentMins >= openMins || currentMins < closeMins;
  }
  return currentMins >= openMins && currentMins < closeMins;
}

export interface AddDraft {
  name: string;
  selectedTags: ResourceTag[];
  pinLat: number | null;
  pinLng: number | null;
  hours: HoursValue;
  directions: string;
  description: string;
  wifiNetworks: WifiNetwork[];
}
