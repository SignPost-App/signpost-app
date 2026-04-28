import { useTranslation } from 'react-i18next';
import { WifiNetwork, WifiPasswordType } from '../types';

interface Props {
  value: WifiNetwork[];
  onChange: (networks: WifiNetwork[]) => void;
}

const PASSWORD_TYPES: WifiPasswordType[] = ['open', 'password', 'ask', 'login', 'unknown'];

export default function WifiNetworkPicker({ value, onChange }: Props) {
  const { t } = useTranslation();

  const addNetwork = () =>
    onChange([...value, { ssid: '', passwordType: 'unknown' }]);

  const remove = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));

  const update = (i: number, patch: Partial<WifiNetwork>) =>
    onChange(value.map((net, idx) => (idx === i ? { ...net, ...patch } : net)));

  return (
    <div>
      {value.map((net, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder={t('wifi.ssidPlaceholder')}
              value={net.ssid}
              onChange={e => update(i, { ssid: e.target.value })}
              aria-label={t('wifi.ssidPlaceholder')}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                fontSize: 15,
                padding: '0 2px',
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label={t('wifi.removeNetwork')}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PASSWORD_TYPES.map(type => {
              const active = net.passwordType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    update(i, {
                      passwordType: type,
                      password: type !== 'password' ? undefined : net.password,
                    })
                  }
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                  aria-pressed={active}
                >
                  {t(`wifi.type.${type}`)}
                </button>
              );
            })}
          </div>

          {net.passwordType === 'password' && (
            <input
              className="form-input"
              style={{ marginTop: 8, marginBottom: 0 }}
              placeholder={t('wifi.passwordPlaceholder')}
              value={net.password ?? ''}
              onChange={e => update(i, { password: e.target.value })}
              aria-label={t('wifi.passwordPlaceholder')}
            />
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={addNetwork}
        style={{ width: '100%' }}
      >
        + {t('wifi.addNetwork')}
      </button>
    </div>
  );
}
