import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  function loadAll() {
    Promise.all([api.getSummary(), api.getDepartments(), api.getFlags()])
      .then(([s, d, f]) => {
        setSummary(s);
        setDepartments(d);
        setFlags(f);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(loadAll, []);

  async function runCheck() {
    setChecking(true);
    setError(null);
    try {
      await api.runFlagCheck();
      loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  }

  async function resolve(id) {
    await api.resolveFlag(id);
    loadAll();
  }

  const lastService = summary[summary.length - 1];
  const chartData = summary.map((s) => ({
    date: new Date(s.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    present: Number(s.total_present),
  }));

  return (
    <div className="ledger">
      <h2 className="section-heading">Dashboard</h2>
      <p className="section-desc">Attendance at a glance, across every service on record.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Last service attendance</p>
          <p className="stat-value">{lastService ? lastService.total_present : '—'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Services on record</p>
          <p className="stat-value">{summary.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Members flagged</p>
          <p className="stat-value">{flags.length}</p>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Attendance trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#D7E8E2" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4A6572' }} axisLine={{ stroke: '#B7D0C6' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#4A6572' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="present" stroke="#2F7A6D" strokeWidth={2.5} dot={{ r: 3, fill: '#2F7A6D' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">By department</h3>
        {departments.map((d) => (
          <div className="roll-row" key={d.department}>
            <span className="roll-name">{d.department}</span>
            <span className="roll-dept">{d.member_count} members · {d.avg_attendance_rate ?? 0}% avg attendance</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 className="chart-title" style={{ margin: 0 }}>Absence flags</h3>
        <button className="btn subtle" onClick={runCheck} disabled={checking}>
          {checking ? 'Checking…' : 'Run flag check'}
        </button>
      </div>

      {flags.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">✓</div>
          No one is currently flagged for absence.
        </div>
      ) : (
        flags.map((f) => (
          <div className="flag-row" key={f.id}>
            <div>
              <div className="flag-name">{f.first_name} {f.last_name}</div>
              <div className="flag-reason">{f.reason}{f.department_name ? ` · ${f.department_name}` : ''}</div>
            </div>
            <button className="btn ghost" onClick={() => resolve(f.id)}>Mark followed up</button>
          </div>
        ))
      )}
    </div>
  );
}
