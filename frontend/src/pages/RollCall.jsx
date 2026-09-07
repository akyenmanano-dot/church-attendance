import React, { useEffect, useState } from 'react';
import { api } from '../api';

const TYPE_LABELS = {
  sunday: 'Sunday Service',
  midweek: 'Midweek / Bible Study',
  special: 'Special Program',
};

const DEFAULT_NAMES = {
  sunday: 'Sunday Service',
  midweek: 'Bible Study',
  special: 'Special Program',
};

export default function RollCall() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [roll, setRoll] = useState([]);
  const [error, setError] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('sunday');
  const [newName, setNewName] = useState('');

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
        await api.markPresent(member.member_id, serviceId);
      }
      const fresh = await api.getRollCall(serviceId);
      setRoll(fresh);
    } catch (e) {
      setError(e.message);
    }
  }

  async function createService() {
    if (!newDate) return;
    try {
      const created = await api.addService({
        service_date: newDate,
        service_type: newType,
        name: newName.trim() || DEFAULT_NAMES[newType],
      });
      setServices((s) => [created, ...s]);
      setServiceId(created.id);
      setNewDate('');
      setNewName('');
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
              {s.name} — {new Date(s.service_date).toDateString()} ({TYPE_LABELS[s.service_type] || s.service_type})
            </option>
          ))}
        </select>
      </div>

      <div className="service-picker" style={{ marginTop: '-0.5rem' }}>
        <select value={newType} onChange={(e) => setNewType(e.target.value)}>
          <option value="sunday">Sunday Service</option>
          <option value="midweek">Midweek / Bible Study</option>
          <option value="special">Special Program</option>
        </select>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        <input
          placeholder={`Name (defaults to "${DEFAULT_NAMES[newType]}")`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ minWidth: '220px' }}
        />
        <button className="btn ghost" onClick={createService}>+ New service</button>
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
