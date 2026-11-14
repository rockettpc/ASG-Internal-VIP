CREATE DATABASE IF NOT EXISTS asg_estimator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE asg_estimator;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  doc_id VARCHAR(64) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) DEFAULT '',
  contact_email VARCHAR(255) DEFAULT '',
  contact_phone VARCHAR(100) DEFAULT '',
  end_client_name VARCHAR(255) DEFAULT '',
  end_client_contact VARCHAR(255) DEFAULT '',
  end_client_email VARCHAR(255) DEFAULT '',
  end_client_phone VARCHAR(100) DEFAULT '',
  proposal_notes TEXT,
  project_address VARCHAR(500) DEFAULT '',
  project_date VARCHAR(100) DEFAULT '',
  valid_until VARCHAR(100) DEFAULT '30 Days from Issue',
  lead_time VARCHAR(255) DEFAULT '3-4 Weeks ARO (Approved Shop Drawings)',
  payment_terms VARCHAR(255) DEFAULT '50% Upon Order Placement, Balance Net 30 Upon Delivery',
  prepared_by VARCHAR(255) DEFAULT 'ASG Commercial Engineering Desk',
  status ENUM('Draft', 'Quoted', 'Approved', 'In Production', 'Completed') NOT NULL DEFAULT 'Draft',
  total_lites INT NOT NULL DEFAULT 0,
  total_gross_sf DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_film_sf DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_weight_lbs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_proposal_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_items (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  tag VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  width_raw VARCHAR(64) NOT NULL,
  height_raw VARCHAR(64) NOT NULL,
  width DECIMAL(10,4) NOT NULL,
  height DECIMAL(10,4) NOT NULL,
  layers_json LONGTEXT NOT NULL,
  notes TEXT,
  fabricator_cost DECIMAL(10,2) DEFAULT NULL,
  unit_price DECIMAL(10,2) DEFAULT NULL,
  revision INT NOT NULL DEFAULT 0,
  revision_history_json LONGTEXT,
  CONSTRAINT fk_project_items_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_attachments (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  storage_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_attachments_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Sample Projects
INSERT IGNORE INTO projects (
  id, doc_id, project_name, client_name, contact_person, contact_email, contact_phone,
  project_address, project_date, valid_until, lead_time, payment_terms, prepared_by,
  status, total_lites, total_gross_sf, total_film_sf, total_weight_lbs, created_at, updated_at
) VALUES
(
  'proj-apex-1048',
  'ASG-EST-1048',
  'Apex Financial HQ - 42nd Floor Executive Suite',
  'Metro Glazing & Facades Corp.',
  'David Miller, Senior Project Manager',
  'dmiller@metroglazing.com',
  '(415) 890-3321',
  '555 California Street, Suite 4200, San Francisco, CA',
  'November 13, 2026',
  '30 Days from Issue',
  '3-4 Weeks ARO (Approved Shop Drawings)',
  '50% Upon Order Placement, Balance Net 30 Upon Delivery',
  'ASG Commercial Engineering Desk',
  'Approved',
  6,
  137.58,
  134.10,
  835.75,
  '2026-11-10 14:20:00',
  '2026-11-12 09:45:00'
),
(
  'proj-stjude-1052',
  'ASG-EST-1052',
  'Pacific Medical Center - ICU Privacy Partitions',
  'Vanguard Glass & Aluminum',
  'Sarah Jenkins, Estimator',
  'sjenkins@vanguardglass.com',
  '(206) 555-0194',
  '1100 9th Ave, Seattle, WA',
  'November 11, 2026',
  '30 Days from Issue',
  '4-5 Weeks ARO',
  '50% Upon Order Placement, Balance Net 30 Upon Delivery',
  'ASG Commercial Engineering Desk',
  'In Production',
  4,
  112.00,
  109.25,
  728.00,
  '2026-11-11 10:15:00',
  '2026-11-13 11:30:00'
),
(
  'proj-hotel-1055',
  'ASG-EST-1055',
  'Harborview Boutique Hotel - Penthouse Spa Suites',
  'Coastal Architectural Systems',
  'Marcus Vance, VP Operations',
  'mvance@coastalarch.com',
  '(310) 555-0148',
  '400 Ocean Blvd, Santa Monica, CA',
  'November 13, 2026',
  '30 Days from Issue',
  '3-4 Weeks ARO',
  '50% Deposit, Net 30 Prior to Crating',
  'ASG Commercial Engineering Desk',
  'Quoted',
  3,
  78.75,
  76.62,
  511.88,
  '2026-11-13 08:00:00',
  '2026-11-13 16:10:00'
);

-- Seed Line Items for Apex Financial HQ
INSERT IGNORE INTO project_items (id, project_id, sort_order, tag, quantity, width_raw, height_raw, width, height, layers_json, notes, unit_price) VALUES
(
  'item-101',
  'proj-apex-1048',
  0,
  'Conference Room 402 - East Glazing Lite 1',
  2,
  '36 1/2',
  '84',
  36.5000,
  84.0000,
  '[{"id":"l1","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"},{"id":"l2","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l3","kind":"active_film","material":"ASG PDLC Switchable Film","nominalThickness":0.015,"offsetDeduction":0.375,"busbarLocation":"Top Edge (Center)","leadLength":"12 ft Teflon leads"},{"id":"l4","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l5","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"}]',
  'Top-hung sliding entrance panel. Busbar concealed in head channel.',
  1850.00
),
(
  'item-102',
  'proj-apex-1048',
  1,
  'Boardroom West Elevation - Center Vision Panel',
  1,
  '48',
  '96',
  48.0000,
  96.0000,
  '[{"id":"l6","kind":"glass","thickness":"3/16\\"","glassType":"Clear","process":"Fully Tempered"},{"id":"l7","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l8","kind":"active_film","material":"ASG PDLC Switchable Film","nominalThickness":0.015,"offsetDeduction":0.375,"busbarLocation":"Top Edge (Center)","leadLength":"12 ft Teflon leads"},{"id":"l9","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l10","kind":"glass","thickness":"3/16\\"","glassType":"Clear","process":"Fully Tempered"}]',
  'Calculates exact weight test unit: 48"x96" two 3/16" plies = 156 lbs.',
  2450.00
),
(
  'item-103',
  'proj-apex-1048',
  2,
  'Executive Office 410 - Perimeter Demising Wall',
  3,
  '36',
  '84',
  36.0000,
  84.0000,
  '[{"id":"l11","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"},{"id":"l12","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l13","kind":"active_film","material":"ASG PDLC Switchable Film","nominalThickness":0.015,"offsetDeduction":0.375,"busbarLocation":"Top Edge (Center)","leadLength":"12 ft Teflon leads"},{"id":"l14","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l15","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"}]',
  'Standard 36" x 84" panel (Film cut: 35-5/8" x 83-5/8"). Neutral silicone seal.',
  1790.00
),
-- Seed Line Items for Pacific Medical Center
(
  'item-201',
  'proj-stjude-1052',
  0,
  'ICU Bay 1-4 Corridor Privacy Windows',
  4,
  '42',
  '96',
  42.0000,
  96.0000,
  '[{"id":"l21","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"},{"id":"l22","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l23","kind":"active_film","material":"ASG PDLC Switchable Film","nominalThickness":0.015,"offsetDeduction":0.375,"busbarLocation":"Top Edge (Right)","leadLength":"12 ft Teflon leads"},{"id":"l24","kind":"interlayer","material":"PVB","thickness":"0.045\\""},{"id":"l25","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"}]',
  'Hospital grade acoustic seal. Top right lead exit to nurse station switch.',
  2100.00
),
-- Seed Line Items for Harborview Boutique Hotel
(
  'item-301',
  'proj-hotel-1055',
  0,
  'Penthouse Shower Enclosure - Switchable Glass',
  3,
  '45',
  '84',
  45.0000,
  84.0000,
  '[{"id":"l31","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"},{"id":"l32","kind":"interlayer","material":"SentryGlas (SG)","thickness":"0.060\\""},{"id":"l33","kind":"active_film","material":"ASG PDLC Switchable Film","nominalThickness":0.015,"offsetDeduction":0.375,"busbarLocation":"Top Edge (Center)","leadLength":"12 ft Teflon leads"},{"id":"l34","kind":"interlayer","material":"SentryGlas (SG)","thickness":"0.060\\""},{"id":"l35","kind":"glass","thickness":"1/4\\"","glassType":"Ultra-Clear Low Iron","process":"Fully Tempered"}]',
  'Wet-location edge sealing required (Dow 995 / neutral cure silicone).',
  2350.00
);

