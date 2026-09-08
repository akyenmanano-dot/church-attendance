import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY_FORM = { first_name: '', last_name: '', phone: '', invited_by: '', notes: '', service_id: '' };

function getRole() {
  try {
    return JSON.parse(localStorage.getItem('user'))?.role;
  } catch {
    return null;
  }
}

export default function FirstTimers() {
  const [firstTimers, setFirstTimers] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [showFollowedUp, setShowFollowedUp] = useState(false);

  function load() {
    api.getFirstTimers().then(setFirstTimers).catch((e) => setError(e.message));
    api.getServices().then(setServices).catch(() => {});
  }

  useEffect(load, []);

  const pending = firstTimers.filter((f) => !f.followed_up);
  const followedUp = firstTimers.filter((f) => f.followed_up);

  async function submit(e) {
    e.preventDefault();
    if (!form.first_name) return;
    try {
      await api.addFirstTimer({ ...form, service_id: form.service_id || null });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resolve(id) {
    try {
      await api.resolveFirstTimer(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    const sure = window.confirm('Remove this entry? This cannot be undone.');
    if (!sure) return;
    try {
      await api.deleteFirstTimer(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ledger">
      <h2 className="section-heading">First-timers</h2>
      <p className="section-desc">Log a new visitor as they arrive, and track follow-up separately from regular members.</p>

      {error && <div className="error-banner">{error}</div>}

      <form className="member-form" onSubmit={submit} style={{ marginBottom: '1.75rem' }}>
        <div className="field">
          <input
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </div>
        <div className="field">
          <input
            placeholder="Last name (optional)"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
        <div className="field">
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="field">
          <input
            placeholder="Invited by (optional)"
            value={form.invited_by}
            onChange={(e) => setForm({ ...form, invited_by: e.target.value })}
          />
        </div>
        <div className="field">
          <select
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
          >
            <option value="">Which service? (optional)</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {new Date(s.service_date).toDateString()}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: '220px' }}>
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button className="btn" type="submit">Log visitor</button>
      </form>

      <h3 className="chart-title" style={{ marginTop: 0 }}>Needs follow-up ({pending.length})</h3>

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">✓</div>
          No first-timers waiting on follow-up right now.
        </div>
      ) : (
        <div style={{ marginBottom: '1.75rem' }}>
          {pending.map((f) => (
            <div className="flag-row" key={f.id}>
              <div>
                <div className="flag-name" style={{ color: 'var(--ink)' }}>{f.first_name} {f.last_name || ''}</div>
                <div className="flag-reason">
                  {f.phone || 'No phone'}
                  {f.invited_by ? ` · invited by ${f.invited_by}` : ''}
                  {f.service_name ? ` · visited ${f.service_name}` : ''}
                  {f.notes ? ` · ${f.notes}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn" onClick={() => resolve(f.id)}>Mark followed up</button>
                {getRole() === 'admin' && (
                  <button className="btn subtle" onClick={() => remove(f.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn ghost" onClick={() => setShowFollowedUp((s) => !s)} style={{ marginBottom: '0.75rem' }}>
        {showFollowedUp ? 'Hide' : 'Show'} followed-up visitors ({followedUp.length})
      </button>

      {showFollowedUp && (
        <div className="member-list">
          {followedUp.map((f) => (
            <div className="member-row" key={f.id}>
              <span>{f.first_name} {f.last_name || ''}</span>
              <span className="m-dept">Followed up {new Date(f.followed_up_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
