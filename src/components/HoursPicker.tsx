import { useTranslation } from 'react-i18next';
import { HoursValue, hoursToString } from '../types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  value: HoursValue;
  onChange: (v: HoursValue) => void;
}

export default function HoursPicker({ value, onChange }: Props) {
  const { t } = useTranslation();

  const setMode = (mode: HoursValue['mode']) => {
    onChange({ ...value, mode: value.mode === mode ? 'custom' : mode });
  };

  const toggleDay = (i: number) => {
    const days = value.days.map((d, idx) =>
      idx === i ? { ...d, open: !d.open } : d
    );
    onChange({ ...value, mode: 'custom', days });
  };

  const setTime = (i: number, field: 'openTime' | 'closeTime', time: string) => {
    const days = value.days.map((d, idx) =>
      idx === i ? { ...d, [field]: time } : d
    );
    onChange({ ...value, mode: 'custom', days });
  };

  const summary = value.mode === 'custom' ? hoursToString(value) : '';

  return (
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
                  <input
                    type="time"
                    className="hours-time-input"
                    value={day.openTime}
                    disabled={!day.open}
                    onChange={e => setTime(i, 'openTime', e.target.value)}
                    aria-label={`${t(`addModal.hoursDay${i}`)} ${t('addModal.hoursOpen')}`}
                  />
                  <span className="hours-time-dash" aria-hidden="true">–</span>
                  <input
                    type="time"
                    className="hours-time-input"
                    value={day.closeTime}
                    disabled={!day.open}
                    onChange={e => setTime(i, 'closeTime', e.target.value)}
                    aria-label={`${t(`addModal.hoursDay${i}`)} ${t('addModal.hoursClose')}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
  );
}
