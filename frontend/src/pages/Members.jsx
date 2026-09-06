import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY_FORM = { first_name: '', last_name: '', phone: '', department_id: '' };

function getRole() {
  try {
    return JSON.parse(localStorage.getItem('user'))?.role;
  } catch {
    return null;
  }
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  function load() {
    api.getMembers().then(setMembers).catch((e) => setError(e.message));
    api.getDepartmentList().then(setDepartments).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  const pending = members.filter((m) => m.status === 'pending');
  const active = members.filter((m) => m.status !== 'pending');

  async function addMember(e) {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;
    try {
      await api.addMember({ ...form, department_id: form.department_id || null });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(m) {
    setEditingId(m.id);
    setEditForm({
      first_name: m.first_name,
      last_name: m.last_name,
      phone: m.phone || '',
      department_id: m.department_id || '',
    });
  }

  async function saveEdit(id) {
    try {
      await api.updateMember(id, { ...editForm, department_id: editForm.department_id || null });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function approveMember(m) {
    try {
      await api.updateMember(m.id, { status: 'active' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMember(m) {
    const sure = window.confirm(`Remove ${m.first_name} ${m.last_name}? This also deletes their attendance history.`);
    if (!sure) return;
    try {
      await api.deleteMember(m.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ledger">
      <h2 className="section-heading">Members</h2>
      <p className="section-desc">The full membership roll. Add, edit, or remove members here.</p>

      {error && <div className="error-banner">{error}</div>}

      {pending.length > 0 && (
        <>
          <h3 className="chart-title" style={{ marginTop: 0 }}>Waiting for approval ({pending.length})</h3>
          <p className="section-desc" style={{ marginTop: '-0.75rem' }}>
            These people added themselves via the public "Join" form. Approve to add them to the official roll.
          </p>
          <div className="member-list" style={{ marginBottom: '1.75rem' }}>
            {pending.map((m) => (
              <div className="flag-row" key={m.id}>
                <div>
                  <div className="flag-name" style={{ color: 'var(--ink)' }}>{m.first_name} {m.last_name}</div>
                  <div className="flag-reason">
                    {m.phone || 'No phone'} · {m.department_name || 'No department'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn" onClick={() => approveMember(m)}>Approve</button>
                  {getRole() === 'admin' && (
                    <button className="btn subtle" onClick={() => removeMember(m)}>Reject</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <form className="member-form" onSubmit={addMember}>
        <div className="field">
          <input
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </div>
        <div className="field">
          <input
            placeholder="Last name"
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
          <select
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
          >
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">Add member</button>
      </form>

      <div className="member-list">
        {active.map((m) => (
          <div className="member-row" key={m.id}>
            {editingId === m.id ? (
              <>
                <div className="field" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                  <input
                    placeholder="Phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                  <select
                    value={editForm.department_id}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn" onClick={() => saveEdit(m.id)}>Save</button>
                  <button className="btn subtle" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>{m.first_name} {m.last_name}</span>{' '}
                  <span className="m-dept">{m.department_name || 'No department'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn ghost" onClick={() => startEdit(m)}>Edit</button>
                  {getRole() === 'admin' && (
                    <button className="btn subtle" onClick={() => removeMember(m)}>Remove</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
