import { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { HoursValue, DayHours, hoursToString } from '../types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const uses12Hour =
  new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? true;

const isMobile = !window.matchMedia('(pointer: fine)').matches;

const toDayjs = (time: string | null): Dayjs | null => {
  if (!time) return null;
  const [hh, mm] = time.split(':').map(Number);
  return dayjs().hour(hh).minute(mm).second(0).millisecond(0);
};

const fromDayjs = (d: Dayjs | null): string | null => {
  if (!d || !d.isValid()) return null;
  return `${String(d.hour()).padStart(2, '0')}:${String(d.minute()).padStart(2, '0')}`;
};

const formatDisplayTime = (time: string | null): string => {
  if (!time) return '--';
  const [hh, mm] = time.split(':').map(Number);
  if (uses12Hour) {
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hour = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return `${hour}:${String(mm).padStart(2, '0')} ${ampm}`;
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// Renders nothing — replaces the MUI text field on mobile so there is no editable input.
const NullField = (_props: object) => null;

const pickerSx = {
  flex: 1,
  minWidth: 0,
  '& .MuiInputBase-root': {
    fontSize: '13px',
    fontFamily: 'var(--font)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
  },
  '& .MuiInputBase-input': {
    padding: '5px 4px 5px 6px',
    fontSize: '13px',
    fontFamily: 'var(--font)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-border)',
    borderWidth: '1.5px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#9ca3af',
  },
  '& .MuiIconButton-root': {
    padding: '2px',
    color: 'var(--color-muted)',
  },
};

interface Props {
  value: HoursValue;
  onChange: (v: HoursValue) => void;
}

// Identifies which day+field the mobile picker is open for, e.g. "3-openTime"
type PickerKey = `${number}-${'openTime' | 'closeTime'}`;

export default function HoursPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<PickerKey | null>(null);

  const setMode = (mode: HoursValue['mode']) => {
    onChange({ ...value, mode: value.mode === mode ? 'custom' : mode });
  };

  const toggleDay = (i: number) => {
    const days = value.days.map((d, idx) =>
      idx === i ? { ...d, open: !d.open } : d
    );
    onChange({ ...value, mode: 'custom', days });
  };

  // During editing: update only the current day (no propagation).
  const setTimeOnly = (i: number, field: 'openTime' | 'closeTime', newVal: string | null) => {
    const days = value.days.map((d, idx) => idx === i ? { ...d, [field]: newVal } : d);
    onChange({ ...value, mode: 'custom', days });
  };

  // On confirm: propagate to all days if this is the first time any day has this field set.
  const setTime = (i: number, field: 'openTime' | 'closeTime', newVal: string | null) => {
    const allOthersNull = value.days.every((d, idx) => idx === i || d[field] === null);
    let days: DayHours[];
    if (allOthersNull && newVal !== null) {
      days = value.days.map(d => ({ ...d, [field]: newVal }));
    } else {
      days = value.days.map((d, idx) => idx === i ? { ...d, [field]: newVal } : d);
    }
    onChange({ ...value, mode: 'custom', days });
  };

  const clearTime = (i: number) => {
    const days = value.days.map((d, idx) =>
      idx === i ? { ...d, openTime: null, closeTime: null } : d
    );
    onChange({ ...value, mode: 'custom', days });
  };

  // Resolve the current mobile picker's context from its key.
  const activePicker = (() => {
    if (!activeKey) return null;
    const [iStr, field] = activeKey.split('-') as [string, 'openTime' | 'closeTime'];
    const i = parseInt(iStr);
    return { i, field, time: value.days[i]?.[field] ?? null };
  })();

  const summary = value.mode === 'custom' ? hoursToString(value) : '';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="hours-picker">
        <div className="hours-presets">
          <button
            type="button"
            className={`hours-preset-btn${value.mode === 'always' ? ' active' : ''}`}
            onClick={() => setMode('always')}
            aria-pressed={value.mode === 'always'}
          >
            {t('addModal.hours247')}
          </button>
          <button
            type="button"
            className={`hours-preset-btn${value.mode === 'closed' ? ' active' : ''}`}
            onClick={() => setMode('closed')}
            aria-pressed={value.mode === 'closed'}
          >
            {t('addModal.hoursClosed')}
          </button>
        </div>

        {value.mode === 'custom' && (
          <div className="hours-day-rows">
            {DAY_SHORT.map((label, i) => {
              const day = value.days[i];
              const hasTime = day.openTime !== null || day.closeTime !== null;
              return (
                <div key={i} className="hours-day-row">
                  <span className={`hours-day-name${day.open ? ' open' : ''}`}>
                    {label}
                  </span>
                  <button
                    type="button"
                    className={`hours-day-toggle${day.open ? ' on' : ''}`}
                    onClick={() => toggleDay(i)}
                    aria-pressed={day.open}
                    aria-label={`${t(`addModal.hoursDay${i}`)}: ${day.open ? t('addModal.hours247') : t('addModal.hoursClosed')}`}
                  />
                  <div className={`hours-day-times${day.open ? '' : ' closed'}`}>
                    {isMobile ? (
                      <>
                        <button
                          type="button"
                          disabled={!day.open}
                          onClick={() => setActiveKey(`${i}-openTime`)}
                          className={`hours-time-btn${!day.openTime ? ' empty' : ''}`}
                          aria-label={`${t(`addModal.hoursDay${i}`)} ${t('addModal.hoursOpen')}`}
                        >
                          {formatDisplayTime(day.openTime)}
                        </button>
                        <span className="hours-time-dash" aria-hidden="true">–</span>
                        <button
                          type="button"
                          disabled={!day.open}
                          onClick={() => setActiveKey(`${i}-closeTime`)}
                          className={`hours-time-btn${!day.closeTime ? ' empty' : ''}`}
                          aria-label={`${t(`addModal.hoursDay${i}`)} ${t('addModal.hoursClose')}`}
                        >
                          {formatDisplayTime(day.closeTime)}
                        </button>
                      </>
                    ) : (
                      <>
                        <DesktopTimePicker
                          ampm={uses12Hour}
                          minutesStep={15}
                          disabled={!day.open}
                          value={toDayjs(day.openTime)}
                          onChange={v => setTimeOnly(i, 'openTime', fromDayjs(v))}
                          onAccept={v => setTime(i, 'openTime', fromDayjs(v))}
                          slotProps={{ textField: { size: 'small', sx: pickerSx } }}
                        />
                        <span className="hours-time-dash" aria-hidden="true">–</span>
                        <DesktopTimePicker
                          ampm={uses12Hour}
                          minutesStep={15}
                          disabled={!day.open}
                          value={toDayjs(day.closeTime)}
                          onChange={v => setTimeOnly(i, 'closeTime', fromDayjs(v))}
                          onAccept={v => setTime(i, 'closeTime', fromDayjs(v))}
                          slotProps={{ textField: { size: 'small', sx: pickerSx } }}
                        />
                      </>
                    )}
                    {day.open && hasTime && (
                      <button
                        type="button"
                        className="hours-time-clear"
                        onClick={() => clearTime(i)}
                        aria-label={t('addModal.clear')}
                        title={t('addModal.clear')}
                      >×</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Single shared MobileTimePicker — rendered only when open, with no text field.
            Buttons above act as the only triggers. */}
        {isMobile && activePicker && (
          <MobileTimePicker
            open
            onClose={() => setActiveKey(null)}
            value={toDayjs(activePicker.time)}
            onChange={v => setTimeOnly(activePicker.i, activePicker.field, fromDayjs(v))}
            onAccept={v => {
              setTime(activePicker.i, activePicker.field, fromDayjs(v));
              setActiveKey(null);
            }}
            ampm={uses12Hour}
            minutesStep={15}
            slots={{ field: NullField }}
          />
        )}

        {(value.mode !== 'custom' || summary) && (
          <div className="hours-summary" aria-live="polite">
            <span aria-hidden="true">🕐</span>{' '}
            {value.mode === 'always'
              ? t('addModal.hours247')
              : value.mode === 'closed'
                ? t('addModal.hoursClosed')
                : summary}
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
