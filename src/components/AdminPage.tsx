import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockResources } from '../mockData';
import { TAG_CONFIG } from '../types';

type Tab = 'overview' | 'resources' | 'reports';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  if (!loggedIn) {
    return (
      <div className="page-container">
        <div className="admin-header">
          <h1>SignPost Admin</h1>
          <Link to="/" className="btn btn-ghost btn-sm">← Map</Link>
        </div>
        <div className="login-card">
          <h2>Moderator Login</h2>
          <p>
            Enter your moderator access code. Admins are pre-approved volunteers —
            contact us to request access.
          </p>
          <div className="form-group">
            <label className="form-label">Access Code</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && code && setLoggedIn(true)}
            />
          </div>
          <button
            className="btn-submit"
            style={{ width: '100%', padding: '11px', borderRadius: 6, fontFamily: 'inherit', border: 'none' }}
            disabled={!code}
            onClick={() => setLoggedIn(true)}
          >
            Sign In Anonymously
          </button>
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
            No personal data is collected. Admin sessions are not linked to identifiable accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>SignPost Admin</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/" className="btn btn-ghost btn-sm">← Map</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => setLoggedIn(false)}>Sign Out</button>
        </div>
      </div>

      <div className="admin-content">
        {/* Stats row */}
        <div className="admin-stat-row">
          <div className="stat-card">
            <div className="stat-value">{mockResources.length}</div>
            <div className="stat-label">Resources</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">3</div>
            <div className="stat-label">Flagged</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>247</div>
            <div className="stat-label">Visitors today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ca8a04' }}>1.2k</div>
            <div className="stat-label">This week</div>
          </div>
        </div>

        {/* Export bar */}
        <div className="export-bar">
          <p>Export all data for backup or migration.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">⬇ Export JSON</button>
            <button className="btn btn-outline btn-sm">⬇ Export CSV</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={`admin-tab ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')}>
            Resources
          </button>
          <button className={`admin-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            Reports <span style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>3</span>
          </button>
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'resources' && <ResourcesTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div>
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Recent Activity</h3>
      <div className="resource-admin-list">
        {[
          { action: '➕ Added', name: 'Belltown Community Center Showers', time: '2 hours ago', color: '#16a34a' },
          { action: '✏️ Edited', name: 'Union Gospel Mission', time: '5 hours ago', color: '#2563eb' },
          { action: '🚩 Flagged', name: 'Pike Place Market Area', time: '1 day ago', color: '#dc2626' },
          { action: '➕ Added', name: 'I-5 Colonnade Park Overhang', time: '2 days ago', color: '#16a34a' },
          { action: '💬 Comment', name: 'Denny Park', time: '2 days ago', color: '#6b7280' },
        ].map((item, i) => (
          <div key={i} className="resource-admin-card">
            <span style={{ color: item.color, fontSize: 13, fontWeight: 600, minWidth: 80 }}>{item.action}</span>
            <div className="resource-admin-info">
              <div className="resource-admin-name">{item.name}</div>
              <div className="resource-admin-meta">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div className="resource-admin-list">
      {mockResources.map(r => (
        <div key={r.id} className="resource-admin-card">
          <span style={{ fontSize: 22 }}>{TAG_CONFIG[r.tags[0]].icon}</span>
          <div className="resource-admin-info">
            <div className="resource-admin-name">{r.name}</div>
            <div className="resource-admin-meta">
              {r.tags.map(t => TAG_CONFIG[t].label).join(' · ')} · Added {r.addedAt}
            </div>
          </div>
          <div className="resource-admin-actions">
            <button className="btn btn-outline btn-sm">Edit</button>
            <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const reports = [
    { id: 'r1', resource: 'Pike Place Market Area', issue: 'Outdated — security has changed, less aggressive now', time: '3 hours ago' },
    { id: 'r2', resource: 'Capitol Hill Library', issue: 'Hours incorrect — they close at 6pm on Saturdays now', time: '1 day ago' },
    { id: 'r3', resource: 'REI Co-op Flagship', issue: 'No longer does propane refills, sells canisters only', time: '2 days ago' },
  ];

  return (
    <div className="resource-admin-list">
      {reports.map(r => (
        <div key={r.id} className="resource-admin-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="resource-admin-name">{r.resource}</div>
              <div className="resource-admin-meta">{r.time}</div>
            </div>
            <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #fca5a5', flexShrink: 0 }}>
              Flagged
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text)' }}>"{r.issue}"</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">View Resource</button>
            <button className="btn btn-sm" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Resolve
            </button>
            <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Remove Resource
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
