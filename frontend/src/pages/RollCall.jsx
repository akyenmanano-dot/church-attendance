import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function RollCall() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [roll, setRoll] = useState([]);
  const [error, setError] = useState(null);
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    api.getServices().then((rows) => {
      setServices(rows);
      if (rows.length) setServiceId(rows[0].id);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!serviceId) return;
    api.getRollCall(serviceId).then(setRoll).catch((e) => setError(e.message));
  }, [serviceId]);

  async function toggle(member) {
    setError(null);
    try {
      if (member.present) {
        await api.unmark(member.member_id, serviceId);
      } else {
        await api.markPresent(member.member_id, serviceId, 'usher');
      }
      const fresh = await api.getRollCall(serviceId);
      setRoll(fresh);
    } catch (e) {
      setError(e.message);
    }
  }

  async function createTodayService() {
    if (!newDate) return;
    try {
      const created = await api.addService({ service_date: newDate, service_type: 'sunday', name: 'Sunday Service' });
      setServices((s) => [created, ...s]);
      setServiceId(created.id);
      setNewDate('');
    } catch (e) {
      setError(e.message);
    }
  }

  const presentCount = roll.filter((m) => m.present).length;

  return (
    <div className="ledger">
      <h2 className="section-heading">Mark attendance</h2>
      <p className="section-desc">Tap a name as members arrive. Safe to have several ushers marking at once.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="service-picker">
        <select value={serviceId || ''} onChange={(e) => setServiceId(Number(e.target.value))}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {new Date(s.service_date).toDateString()}
            </option>
          ))}
        </select>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        <button className="btn ghost" onClick={createTodayService}>+ New service</button>
      </div>

      {roll.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">—</div>
          No active members yet. Add members in the Members tab.
        </div>
      ) : (
        <>
          <div className="roll">
            {roll.map((m) => (
              <div className="roll-row" key={m.member_id}>
                <div className="who">
                  <span className="roll-name">{m.first_name} {m.last_name}</span>
                </div>
                <button
                  className={`mark-btn ${m.present ? 'present' : ''}`}
                  onClick={() => toggle(m)}
                >
                  {m.present ? '✓ Present' : 'Mark present'}
                </button>
              </div>
            ))}
          </div>
          <div className="roll-total">
            <b>{presentCount}</b> / {roll.length} present
          </div>
        </>
      )}
    </div>
  );
}
