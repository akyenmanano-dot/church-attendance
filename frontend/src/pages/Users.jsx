import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  function load() {
    api.getUsers().then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function startReset(id) {
    setResettingId(id);
    setNewPassword('');
    setSuccess(null);
    setError(null);
  }

  async function submitReset(id, name) {
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    try {
      await api.adminResetPassword(id, newPassword);
      setSuccess(`Password reset for ${name}. Let them know their new password directly.`);
      setResettingId(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleRole(u) {
    setError(null);
    setSuccess(null);
    const newRole = u.role === 'admin' ? 'usher' : 'admin';
    const sure = window.confirm(
      newRole === 'admin'
        ? `Make ${u.name} an admin? They'll be able to delete members and manage other accounts.`
        : `Remove admin from ${u.name}? They'll become a regular usher.`
    );
    if (!sure) return;
    try {
      await api.changeUserRole(u.id, newRole);
      setSuccess(`${u.name} is now ${newRole === 'admin' ? 'an admin' : 'a usher'}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ledger">
      <h2 className="section-heading">Usher &amp; admin accounts</h2>
      <p className="section-desc">
        Since this system doesn't send reset emails, an admin can reset anyone's
        password directly here. Having more than one admin also means the church
        isn't stuck if a single admin forgets their password or is unavailable.
        Usher accounts: {users.filter((u) => u.role === 'usher').length} / 5 used.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="roll-row" style={{ background: 'var(--sage-dim)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--sage)', fontWeight: 500 }}>{success}</span>
        </div>
      )}

      <div className="member-list">
        {users.map((u) => (
          <div className="member-row" key={u.id}>
            {resettingId === u.id ? (
              <>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span>{u.name}</span>
                  <input
                    type="text"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ minWidth: '220px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn" onClick={() => submitReset(u.id, u.name)}>Save</button>
                  <button className="btn subtle" onClick={() => setResettingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>{u.name}</span>{' '}
                  <span className="m-dept">{u.email} · {u.role}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn ghost" onClick={() => startReset(u.id)}>Reset password</button>
                  <button className="btn subtle" onClick={() => toggleRole(u)}>
                    {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
