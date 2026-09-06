import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'join'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [joinForm, setJoinForm] = useState({ first_name: '', last_name: '', phone: '', email: '', department_id: '' });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'join') {
      api.getDepartmentList().then(setDepartments).catch(() => {});
    }
  }, [mode]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register(form.name, form.email, form.password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onAuthed(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitJoin(e) {
    e.preventDefault();
    setError(null);
    if (!joinForm.first_name || !joinForm.last_name) {
      setError('First and last name are required');
      return;
    }
    setLoading(true);
    try {
      await api.selfRegisterMember({ ...joinForm, department_id: joinForm.department_id || null });
      setJoinSuccess(true);
      setJoinForm({ first_name: '', last_name: '', phone: '', email: '', department_id: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">The Register</h1>
        <p className="app-subtitle">Church attendance, kept simply</p>
      </header>
      <div className="ledger" style={{ maxWidth: 460 }}>
        {mode === 'join' ? (
          joinSuccess ? (
            <>
              <h2 className="section-heading">You're on the list</h2>
              <p className="section-desc">
                Thanks! An usher or admin will confirm your details before you show up
                on the official roll — that usually happens by the next service.
              </p>
              <button className="btn ghost" onClick={() => { setJoinSuccess(false); setMode('login'); }}>
                Back to login
              </button>
            </>
          ) : (
            <>
              <h2 className="section-heading">Join the church roll</h2>
              <p className="section-desc">
                Add your own details. No account needed — an usher or admin will
                confirm you before you appear in official attendance.
              </p>

              {error && <div className="error-banner">{error}</div>}

              <form onSubmit={submitJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <input
                  placeholder="First name"
                  value={joinForm.first_name}
                  onChange={(e) => setJoinForm({ ...joinForm, first_name: e.target.value })}
                />
                <input
                  placeholder="Last name"
                  value={joinForm.last_name}
                  onChange={(e) => setJoinForm({ ...joinForm, last_name: e.target.value })}
                />
                <input
                  placeholder="Phone (optional)"
                  value={joinForm.phone}
                  onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                />
                <select
                  value={joinForm.department_id}
                  onChange={(e) => setJoinForm({ ...joinForm, department_id: e.target.value })}
                >
                  <option value="">No department / not sure</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit my details'}
                </button>
              </form>

              <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                <button className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setMode('login')}>
                  Back to usher/admin login
                </button>
              </p>
            </>
          )
        ) : (
          <>
            <h2 className="section-heading">{mode === 'login' ? 'Log in' : 'Create an account'}</h2>
            <p className="section-desc">
              {mode === 'login'
                ? 'Enter your usher/admin account to mark attendance.'
                : 'The first person to register becomes the admin automatically.'}
            </p>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {mode === 'register' && (
                <input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
              </button>
            </form>

            <p style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {mode === 'login' ? (
                <span>No usher/admin account? <button className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setMode('register')}>Register</button></span>
              ) : (
                <span>Already have an account? <button className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setMode('login')}>Log in</button></span>
              )}
              <span>Church member wanting to be added to the roll? <button className="btn ghost" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setMode('join')}>Join here</button></span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
