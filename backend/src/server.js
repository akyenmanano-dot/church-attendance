require('dotenv').config();
const express = require('express');
const cors = require('cors');

const membersRouter = require('./routes/members');
const servicesRouter = require('./routes/services');
const attendanceRouter = require('./routes/attendance');
const dashboardRouter = require('./routes/dashboard');
const flagsJobRouter = require('./routes/flagsJob');
const departmentsRouter = require('./routes/departments');
const authRouter = require('./routes/auth');
const firstTimersRouter = require('./routes/firstTimers');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/members', membersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/run-flag-check', flagsJobRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/first-timers', firstTimersRouter);

// Basic error handler so unhandled async errors return JSON, not a stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Church attendance API running on port ${PORT}`));
