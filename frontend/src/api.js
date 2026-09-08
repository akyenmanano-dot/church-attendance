// In local development, Vite's proxy forwards /api to localhost:4000 (see vite.config.js).
// In production, set VITE_API_URL to your deployed backend's URL (e.g. https://your-backend.onrender.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // session expired or missing — clear it so the login screen shows again
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  register: (name, email, password) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handle),
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handle),
  getUsers: () => fetch(`${BASE}/auth/users`, { headers: authHeaders() }).then(handle),
  adminResetPassword: (userId, newPassword) =>
    fetch(`${BASE}/auth/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ newPassword }),
    }).then(handle),
  changeUserRole: (userId, role) =>
    fetch(`${BASE}/auth/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ role }),
    }).then(handle),

  // members
  getMembers: (params = {}) =>
    fetch(`${BASE}/members?${new URLSearchParams(params)}`).then(handle),
  addMember: (member) =>
    fetch(`${BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(member),
    }).then(handle),
  selfRegisterMember: (member) =>
    fetch(`${BASE}/members/self-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    }).then(handle),
  lookupMyAttendance: (first_name, last_name, phone) =>
    fetch(`${BASE}/members/my-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, phone }),
    }).then(handle),
  updateMember: (id, member) =>
    fetch(`${BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(member),
    }).then(handle),
  deleteMember: (id) =>
    fetch(`${BASE}/members/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  getMemberAttendance: (id) => fetch(`${BASE}/members/${id}/attendance`).then(handle),
  getDepartmentList: () => fetch(`${BASE}/departments`).then(handle),

  // services
  getServices: () => fetch(`${BASE}/services`).then(handle),
  addService: (service) =>
    fetch(`${BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(service),
    }).then(handle),

  // attendance
  getRollCall: (serviceId) => fetch(`${BASE}/attendance/service/${serviceId}`).then(handle),
  markPresent: (member_id, service_id) =>
    fetch(`${BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ member_id, service_id }),
    }).then(handle),
  unmark: (member_id, service_id) =>
    fetch(`${BASE}/attendance`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ member_id, service_id }),
    }).then(handle),

  // dashboard
  getSummary: () => fetch(`${BASE}/dashboard/summary`).then(handle),
  getDepartments: () => fetch(`${BASE}/dashboard/departments`).then(handle),
  getFlags: () => fetch(`${BASE}/dashboard/flags`).then(handle),
  resolveFlag: (id) =>
    fetch(`${BASE}/dashboard/flags/${id}/resolve`, { method: 'POST', headers: authHeaders() }).then(handle),
  runFlagCheck: () =>
    fetch(`${BASE}/run-flag-check`, { method: 'POST', headers: authHeaders() }).then(handle),

  // first-timers
  getFirstTimers: () => fetch(`${BASE}/first-timers`, { headers: authHeaders() }).then(handle),
  addFirstTimer: (data) =>
    fetch(`${BASE}/first-timers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  resolveFirstTimer: (id) =>
    fetch(`${BASE}/first-timers/${id}/resolve`, { method: 'POST', headers: authHeaders() }).then(handle),
  deleteFirstTimer: (id) =>
    fetch(`${BASE}/first-timers/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};
