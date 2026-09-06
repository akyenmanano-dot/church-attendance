-- Sample seed data for local testing

INSERT INTO departments (name) VALUES
  ('Choir'), ('Ushering'), ('Youth'), ('Children'), ('Media')
ON CONFLICT DO NOTHING;

INSERT INTO members (first_name, last_name, phone, department_id) VALUES
  ('Ama', 'Boateng', '0244000001', 1),
  ('Kwame', 'Owusu', '0244000002', 2),
  ('Efua', 'Mensah', '0244000003', 3),
  ('Kofi', 'Asante', '0244000004', NULL),
  ('Adjoa', 'Sarpong', '0244000005', 4)
ON CONFLICT DO NOTHING;

-- Last 4 Sundays
INSERT INTO services (service_date, service_type, name) VALUES
  (CURRENT_DATE - INTERVAL '21 days', 'sunday', 'Sunday Service'),
  (CURRENT_DATE - INTERVAL '14 days', 'sunday', 'Sunday Service'),
  (CURRENT_DATE - INTERVAL '7 days',  'sunday', 'Sunday Service'),
  (CURRENT_DATE,                      'sunday', 'Sunday Service')
ON CONFLICT DO NOTHING;
