import React, { useState } from 'react';
import RollCall from './pages/RollCall';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import FirstTimers from './pages/FirstTimers';
import Users from './pages/Users';
import Login from './pages/Login';

const BASE_TABS = [
  { id: 'roll', label: 'Mark attendance' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Members' },
  { id: 'first-timers', label: 'First-timers' },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState('roll');
  const [user, setUser] = useState(getStoredUser());

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  if (!user) {
    return <Login onAuthed={setUser} />;
  }

  const TABS = user.role === 'admin'
    ? [...BASE_TABS, { id: 'users', label: 'Users' }]
    : BASE_TABS;

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="app-title">The Register</h1>
            <p className="app-subtitle">Church attendance, kept simply</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--paper)', fontSize: '0.85rem', margin: '0 0 0.4rem' }}>
              {user.name} · {user.role}
            </p>
            <button className="btn subtle" onClick={logout}>Log out</button>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'roll' && <RollCall />}
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'members' && <Members />}
      {tab === 'first-timers' && <FirstTimers />}
      {tab === 'users' && user.role === 'admin' && <Users />}
    </div>
  );
}
