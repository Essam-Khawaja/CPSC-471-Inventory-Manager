-- Seed data: realistic global freight network for demonstration
-- Users use ON CONFLICT so they are safe to re-run. Other tables do not.

BEGIN;

-- USERS (idempotent)
INSERT INTO users(name, email, password, role_id)
VALUES
  ('Admin User',       'admin@example.com',  'dev-only', 1),
  ('Test Admin',       'test@example.com',   'dev-only', 1),
  ('Alice Carter',     'staff1@example.com', 'dev-only', 2),
  ('Bob Nguyen',       'staff2@example.com', 'dev-only', 2),
  ('Clara Johansson',  'staff3@example.com', 'dev-only', 2),
  ('David Okafor',     'staff4@example.com', 'dev-only', 2),
  ('Emily Zhang',      'staff5@example.com', 'dev-only', 2)
ON CONFLICT (email) DO NOTHING;

INSERT INTO admins(user_id, admin_level)
SELECT user_id, 1 FROM users WHERE email IN ('admin@example.com', 'test@example.com')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO warehouse_staff(user_id, job_title, shift)
SELECT user_id, 'Warehouse Operator', 'Day'
FROM users WHERE email IN ('staff1@example.com', 'staff2@example.com', 'staff3@example.com', 'staff4@example.com', 'staff5@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- LOCATIONS
INSERT INTO locations(location_name, location_type) VALUES
  ('Calgary Central Warehouse',         'WAREHOUSE'),
  ('Calgary Intermodal Terminal',        'RAIL_TERMINAL'),
  ('Vancouver Fraser Port',             'PORT'),
  ('Vancouver Logistics Park',          'WAREHOUSE'),
  ('Toronto Pearson Cargo Hub',         'AIRPORT'),
  ('Toronto Brampton Distribution',     'DISTRIBUTION'),
  ('Port of Montreal',                  'PORT'),
  ('Montreal Dorval Warehouse',         'WAREHOUSE'),
  ('Edmonton Logistics Centre',         'WAREHOUSE'),
  ('Port of Halifax',                   'PORT'),
  ('Winnipeg CentrePort Terminal',      'RAIL_TERMINAL'),
  ('Winnipeg Distribution Centre',      'DISTRIBUTION'),
  ('Ottawa South Distribution',         'DISTRIBUTION'),
  ('Port of Prince Rupert',             'PORT'),
  ('Hamilton Bayfront Terminal',        'PORT'),
  ('Port of Los Angeles',               'PORT'),
  ('Port of Long Beach',                'PORT'),
  ('Port of New York/New Jersey',       'PORT'),
  ('Houston Ship Channel Terminal',     'PORT'),
  ('Port of Miami',                     'PORT'),
  ('Chicago Intermodal Hub',            'RAIL_TERMINAL'),
  ('Port of Savannah',                  'PORT'),
  ('Port of Santos, Brazil',            'PORT'),
  ('Port of Cartagena, Colombia',       'PORT'),
  ('Mexico City Logistics Hub',         'DISTRIBUTION'),
  ('Buenos Aires Puerto Nuevo',         'PORT'),
  ('Panama Canal Logistics Zone',       'PORT'),
  ('Port of Rotterdam',                 'PORT'),
  ('Port of Hamburg',                   'PORT'),
  ('Port of Antwerp-Bruges',            'PORT'),
  ('Port of Felixstowe',                'PORT'),
  ('Port of Gdańsk',                    'PORT'),
  ('London Gateway Terminal',           'PORT'),
  ('Port of Barcelona',                 'PORT'),
  ('Port of Genoa',                     'PORT'),
  ('Port of Marseille-Fos',             'PORT'),
  ('Port of Valencia',                  'PORT'),
  ('Port of Piraeus, Greece',           'PORT'),
  ('Istanbul Ambarlı Port',             'PORT'),
  ('Port of Shanghai',                  'PORT'),
  ('Port of Shenzhen',                  'PORT'),
  ('Hong Kong Kwai Tsing Terminal',     'PORT'),
  ('Port of Tokyo',                     'PORT'),
  ('Port of Yokohama',                  'PORT'),
  ('Port of Busan',                     'PORT'),
  ('Kaohsiung Port, Taiwan',            'PORT'),
  ('Port of Singapore',                 'PORT'),
  ('Laem Chabang Port, Thailand',       'PORT'),
  ('Cat Lai Port, Ho Chi Minh City',    'PORT'),
  ('Tanjung Priok Port, Jakarta',       'PORT'),
  ('Port of Manila',                    'PORT'),
  ('Nhava Sheva Port, Mumbai',          'PORT'),
  ('Port of Colombo, Sri Lanka',        'PORT'),
  ('Jebel Ali Port, Dubai',             'PORT'),
  ('Jeddah Islamic Port',               'PORT'),
  ('Apapa Port, Lagos',                 'PORT'),
  ('Port of Durban',                    'PORT'),
  ('Port of Mombasa',                   'PORT'),
  ('Tanger Med Port, Morocco',          'PORT'),
  ('Port of Cape Town',                 'PORT'),
  ('Port of Sydney',                    'PORT'),
  ('Port of Melbourne',                 'PORT'),
  ('Port of Auckland',                  'PORT');

-- WAREHOUSES
INSERT INTO warehouses(name, address, capacity, location_id)
SELECT v.wname, v.addr, v.cap, l.location_id
FROM (VALUES
  ('Calgary Central Warehouse'::TEXT,    '2850 Sunridge Blvd NE, Calgary, AB'::TEXT,       3500000::INT,  'Calgary Central Warehouse'::TEXT),
  ('Vancouver Logistics Park',          '1255 Commissioner St, Vancouver, BC',             1500000,       'Vancouver Logistics Park'),
  ('Toronto Brampton DC',               '8400 Lawson Rd, Milton, ON',                       750000,       'Toronto Brampton Distribution'),
  ('Montreal Dorval Warehouse',         '6500 Ch. St-François, Dorval, QC',                 200000,       'Montreal Dorval Warehouse'),
  ('Edmonton Logistics Centre',         '2151 Winterburn Rd NW, Edmonton, AB',             5700000,       'Edmonton Logistics Centre'),
  ('Winnipeg Distribution Centre',      '2000 Berry St, Winnipeg, MB',                     8500000,       'Winnipeg Distribution Centre'),
  ('Ottawa South Warehouse',            '1150 Leitrim Rd, Ottawa, ON',                       50000,       'Ottawa South Distribution'),
  ('Rotterdam Hub Warehouse',           'Europaweg 300, 3199 LC Rotterdam, NL',            6500000,       'Port of Rotterdam'),
  ('Shanghai Bonded Warehouse',         '189 Yangshupu Rd, Hongkou, Shanghai, CN',         1200000,       'Port of Shanghai'),
  ('Singapore FTZ Warehouse',           '1 Harbour Front Walk, Singapore 098585',           900000,       'Port of Singapore'),
  ('Dubai Jebel Ali Warehouse',         'P.O. Box 17000, Jebel Ali, Dubai, UAE',            500000,       'Jebel Ali Port, Dubai'),
  ('Los Angeles Gateway Warehouse',     '2500 Navy Way, San Pedro, CA 90731, USA',          550000,       'Port of Los Angeles')
) AS v(wname, addr, cap, locname)
JOIN locations l ON l.location_name = v.locname;

-- Admin warehouse assignments
INSERT INTO manages(admin_user_id, warehouse_id)
SELECT u.user_id, w.warehouse_id
FROM users u, warehouses w
WHERE u.email = 'admin@example.com'
  AND w.name IN (
    'Calgary Central Warehouse',
    'Vancouver Logistics Park',
    'Toronto Brampton DC',
    'Edmonton Logistics Centre',
    'Rotterdam Hub Warehouse',
    'Shanghai Bonded Warehouse'
  )
ON CONFLICT DO NOTHING;

INSERT INTO manages(admin_user_id, warehouse_id)
SELECT u.user_id, w.warehouse_id
FROM users u, warehouses w
WHERE u.email = 'test@example.com'
  AND w.name IN (
    'Montreal Dorval Warehouse',
    'Winnipeg Distribution Centre',
    'Ottawa South Warehouse',
    'Los Angeles Gateway Warehouse',
    'Singapore FTZ Warehouse',
    'Dubai Jebel Ali Warehouse'
  )
ON CONFLICT DO NOTHING;

-- Staff warehouse assignments
UPDATE warehouse_staff SET warehouse_id = (SELECT warehouse_id FROM warehouses WHERE name = 'Calgary Central Warehouse')
WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff1@example.com');

UPDATE warehouse_staff SET warehouse_id = (SELECT warehouse_id FROM warehouses WHERE name = 'Vancouver Logistics Park')
WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff2@example.com');

UPDATE warehouse_staff SET warehouse_id = (SELECT warehouse_id FROM warehouses WHERE name = 'Toronto Brampton DC')
WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff3@example.com');

UPDATE warehouse_staff SET warehouse_id = (SELECT warehouse_id FROM warehouses WHERE name = 'Montreal Dorval Warehouse')
WHERE user_id = (SELECT user_id FROM users WHERE email = 'staff4@example.com');

-- CARRIERS
INSERT INTO carriers(name, carrier_type) VALUES
  ('Maersk Line',                 'SEA'),
  ('MSC Mediterranean',           'SEA'),
  ('CMA CGM Group',               'SEA'),
  ('Hapag-Lloyd',                  'SEA'),
  ('COSCO Shipping',               'SEA'),
  ('Evergreen Marine',             'SEA'),
  ('ONE Ocean Network Express',    'SEA'),
  ('Yang Ming Marine',             'SEA'),
  ('FedEx Express',                'AIR'),
  ('UPS Airlines',                 'AIR'),
  ('DHL Aviation',                 'AIR'),
  ('Air Canada Cargo',             'AIR'),
  ('Emirates SkyCargo',            'AIR'),
  ('Cathay Pacific Cargo',         'AIR'),
  ('CN Rail',                      'RAIL'),
  ('CP Rail',                      'RAIL'),
  ('BNSF Railway',                 'RAIL'),
  ('Union Pacific Railroad',       'RAIL'),
  ('J.B. Hunt Transport',          'ROAD'),
  ('Schneider National',           'ROAD'),
  ('XPO Logistics',                'ROAD'),
  ('TransForce International',     'ROAD');

-- ROUTES (estimated transit times in days)
INSERT INTO routes(estimated_time) VALUES
  (1),(2),(3),(4),(5),(7),(8),(10),(12),(14),
  (16),(18),(21),(24),(28),(30),(35),(40),(45);

-- CARGO ITEMS (per-unit weights in kg)
INSERT INTO cargo_items(cargo_type, weight) VALUES
  ('Consumer Electronics Pallets',    850.00),
  ('Automotive Engine Blocks',       2400.00),
  ('Pharmaceutical Crates',           320.00),
  ('Raw Cotton Bales',               1800.00),
  ('Softwood Lumber Bundle',         3200.00),
  ('Canadian Hard Red Wheat',       27000.00),
  ('Crude Oil Drum Pallet',          8500.00),
  ('Hot-Rolled Steel Coils',        22000.00),
  ('Frozen Atlantic Salmon',         1200.00),
  ('Fresh BC Blueberries',            450.00),
  ('CNC Milling Machine',            4800.00),
  ('Industrial Solvent Drums',       1500.00),
  ('Flat-Pack Furniture Sets',        680.00),
  ('Okanagan Ice Wine Cases',         280.00),
  ('MRI Scanner Unit',               6200.00),
  ('Copper Wire Spools',             3600.00),
  ('Newsprint Paper Rolls',          4200.00),
  ('All-Season Tire Pallets',        1100.00),
  ('Polyethylene Pellets',            950.00),
  ('Colombian Coffee Sacks',         2100.00),
  ('Indian Basmati Rice',            1600.00),
  ('Japanese Auto Parts Crate',      1350.00),
  ('German Optical Instruments',      420.00),
  ('Chilean Copper Cathodes',       18000.00),
  ('Australian Merino Wool',         2800.00),
  ('Italian Carrara Marble',        14000.00),
  ('Thai Natural Rubber Bales',      3400.00),
  ('Korean Semiconductor Wafers',     180.00),
  ('Brazilian Soybean Bulk',        25000.00),
  ('Norwegian Farmed Shrimp',         800.00);

-- SHIPMENTS (55 shipments across global trade lanes)
INSERT INTO shipments(shipment_date, status, carrier_id, route_id, origin_loc_id, destination_loc_id)
SELECT v.d::DATE, v.st, c.carrier_id, r.route_id, lo.location_id, ld.location_id
FROM (VALUES
  ('2025-10-05'::TEXT,'DELIVERED'::TEXT,'Maersk Line'::TEXT,          14::INT,'Port of Shanghai'::TEXT,               'Vancouver Fraser Port'::TEXT),
  ('2025-10-08','DELIVERED','COSCO Shipping',                        12,'Port of Shanghai',                          'Port of Los Angeles'),
  ('2025-10-12','DELIVERED','Evergreen Marine',                      14,'Port of Shenzhen',                          'Port of Long Beach'),
  ('2025-10-15','DELIVERED','ONE Ocean Network Express',             10,'Port of Busan',                             'Vancouver Fraser Port'),
  ('2025-10-18','DELIVERED','Hapag-Lloyd',                           12,'Port of Rotterdam',                         'Port of Montreal'),
  ('2025-10-22','DELIVERED','MSC Mediterranean',                     10,'Port of Hamburg',                           'Port of Halifax'),
  ('2025-10-25','DELIVERED','Yang Ming Marine',                      10,'Port of Tokyo',                             'Vancouver Fraser Port'),
  ('2025-10-28','DELIVERED','CMA CGM Group',                         14,'Port of Santos, Brazil',                   'Port of Miami'),
  ('2025-11-02','DELIVERED','Maersk Line',                            7,'Port of Singapore',                        'Jebel Ali Port, Dubai'),
  ('2025-11-06','DELIVERED','MSC Mediterranean',                     21,'Nhava Sheva Port, Mumbai',                 'Port of Rotterdam'),
  ('2025-11-10','DELIVERED','Hapag-Lloyd',                           14,'Port of Genoa',                            'Port of New York/New Jersey'),
  ('2025-11-14','DELIVERED','CMA CGM Group',                         21,'Port of Durban',                           'Port of Rotterdam'),
  ('2025-11-18','DELIVERED','Evergreen Marine',                       8,'Port of Melbourne',                        'Port of Singapore'),
  ('2025-11-22','DELIVERED','Yang Ming Marine',                      14,'Kaohsiung Port, Taiwan',                   'Port of Los Angeles'),
  ('2025-11-26','DELIVERED','ONE Ocean Network Express',              5,'Cat Lai Port, Ho Chi Minh City',           'Port of Busan'),
  ('2025-11-30','DELIVERED','CN Rail',                                2,'Calgary Central Warehouse',                'Vancouver Fraser Port'),
  ('2025-12-02','DELIVERED','CP Rail',                                1,'Toronto Brampton Distribution',            'Port of Montreal'),
  ('2025-12-05','DELIVERED','J.B. Hunt Transport',                    1,'Edmonton Logistics Centre',                'Calgary Central Warehouse'),
  ('2025-12-08','DELIVERED','CN Rail',                                3,'Winnipeg CentrePort Terminal',             'Toronto Brampton Distribution'),
  ('2025-12-11','DELIVERED','CP Rail',                                2,'Port of Halifax',                          'Port of Montreal'),
  ('2025-12-14','DELIVERED','Air Canada Cargo',                       1,'Calgary Intermodal Terminal',              'Toronto Pearson Cargo Hub'),
  ('2025-12-17','DELIVERED','MSC Mediterranean',                     12,'Port of Antwerp-Bruges',                  'Port of New York/New Jersey'),
  ('2025-12-20','DELIVERED','CMA CGM Group',                         14,'Port of Barcelona',                       'Port of Montreal'),
  ('2025-12-23','DELIVERED','Maersk Line',                           10,'Jeddah Islamic Port',                     'Port of Singapore'),
  ('2025-12-27','DELIVERED','COSCO Shipping',                         5,'Port of Shanghai',                        'Port of Singapore'),
  ('2026-01-05','IN_TRANSIT','Hapag-Lloyd',                          24,'Port of Rotterdam',                       'Vancouver Fraser Port'),
  ('2026-01-10','IN_TRANSIT','Maersk Line',                          14,'Port of Shanghai',                        'Vancouver Fraser Port'),
  ('2026-01-15','IN_TRANSIT','Evergreen Marine',                     12,'Port of Busan',                           'Port of Los Angeles'),
  ('2026-01-20','IN_TRANSIT','COSCO Shipping',                       28,'Port of Shenzhen',                        'Port of New York/New Jersey'),
  ('2026-01-25','IN_TRANSIT','MSC Mediterranean',                    10,'Port of Hamburg',                          'Port of Halifax'),
  ('2026-01-30','IN_TRANSIT','ONE Ocean Network Express',             7,'Port of Singapore',                       'Jebel Ali Port, Dubai'),
  ('2026-02-03','IN_TRANSIT','CMA CGM Group',                        24,'Nhava Sheva Port, Mumbai',                'Port of Hamburg'),
  ('2026-02-08','IN_TRANSIT','Yang Ming Marine',                     10,'Port of Tokyo',                           'Vancouver Fraser Port'),
  ('2026-02-13','IN_TRANSIT','Hapag-Lloyd',                          16,'Port of Santos, Brazil',                  'Houston Ship Channel Terminal'),
  ('2026-02-18','IN_TRANSIT','MSC Mediterranean',                    18,'Apapa Port, Lagos',                       'London Gateway Terminal'),
  ('2026-02-23','IN_TRANSIT','Maersk Line',                          14,'Port of Durban',                          'Nhava Sheva Port, Mumbai'),
  ('2026-02-28','IN_TRANSIT','Evergreen Marine',                     12,'Port of Melbourne',                       'Port of Shanghai'),
  ('2026-03-03','IN_TRANSIT','CN Rail',                               2,'Calgary Central Warehouse',               'Winnipeg CentrePort Terminal'),
  ('2026-03-07','IN_TRANSIT','CP Rail',                               2,'Vancouver Fraser Port',                   'Calgary Central Warehouse'),
  ('2026-03-11','IN_TRANSIT','CMA CGM Group',                         5,'Port of Genoa',                           'Istanbul Ambarlı Port'),
  ('2026-03-15','IN_TRANSIT','Maersk Line',                           4,'Port of Cartagena, Colombia',             'Port of Miami'),
  ('2026-03-19','IN_TRANSIT','COSCO Shipping',                        8,'Panama Canal Logistics Zone',             'Port of Los Angeles'),
  ('2026-03-23','PENDING','Maersk Line',                             30,'Port of Shanghai',                        'Port of Savannah'),
  ('2026-03-27','PENDING','Evergreen Marine',                        10,'Port of Busan',                           'Vancouver Fraser Port'),
  ('2026-03-31','PENDING','Hapag-Lloyd',                             16,'Port of Rotterdam',                       'Toronto Brampton Distribution'),
  ('2026-04-03','PENDING','CMA CGM Group',                            8,'Port of Singapore',                       'Port of Sydney'),
  ('2026-04-06','PENDING','MSC Mediterranean',                       12,'Port of Hamburg',                          'Port of New York/New Jersey'),
  ('2026-04-09','PENDING','ONE Ocean Network Express',                5,'Jebel Ali Port, Dubai',                   'Nhava Sheva Port, Mumbai'),
  ('2026-04-12','PENDING','COSCO Shipping',                          35,'Port of Shanghai',                        'Port of Rotterdam'),
  ('2026-04-15','PENDING','Yang Ming Marine',                         7,'Port of Tokyo',                           'Port of Singapore'),
  ('2025-11-08','CANCELLED','COSCO Shipping',                        14,'Port of Shanghai',                        'Port of Los Angeles'),
  ('2025-12-03','CANCELLED','CMA CGM Group',                         24,'Port of Santos, Brazil',                  'Port of Rotterdam'),
  ('2026-01-17','CANCELLED','ONE Ocean Network Express',             28,'Port of Busan',                           'Port of New York/New Jersey'),
  ('2026-02-10','CANCELLED','Maersk Line',                           14,'Nhava Sheva Port, Mumbai',                'Port of Cape Town'),
  ('2026-03-01','CANCELLED','Yang Ming Marine',                      35,'Port of Tokyo',                           'Port of Hamburg')
) AS v(d, st, carrier_name, est_time, origin_name, dest_name)
JOIN carriers c   ON c.name = v.carrier_name
JOIN routes  r    ON r.estimated_time = v.est_time
JOIN locations lo ON lo.location_name = v.origin_name
JOIN locations ld ON ld.location_name = v.dest_name;

-- CONTAINERS (assigned to shipments by date)
INSERT INTO containers(container_type, max_capacity, shipment_id)
SELECT v.ctype, v.cap::NUMERIC, s.shipment_id
FROM (VALUES
  ('40ft Standard Dry'::TEXT,   26780::INT, '2025-10-05'::DATE),
  ('40ft High Cube Dry',        26460,      '2025-10-05'),
  ('40ft Standard Dry',         26780,      '2025-10-08'),
  ('20ft Standard Dry',         21770,      '2025-10-08'),
  ('40ft High Cube Dry',        26460,      '2025-10-12'),
  ('40ft Standard Dry',         26780,      '2025-10-12'),
  ('40ft High Cube Dry',        26460,      '2025-10-15'),
  ('40ft Standard Dry',         26780,      '2025-10-18'),
  ('20ft Refrigerated',         21250,      '2025-10-18'),
  ('40ft Standard Dry',         26780,      '2025-10-22'),
  ('40ft High Cube Dry',        26460,      '2025-10-25'),
  ('20ft Standard Dry',         21770,      '2025-10-25'),
  ('40ft Standard Dry',         26780,      '2025-10-28'),
  ('40ft High Cube Dry',        26460,      '2025-10-28'),
  ('20ft Standard Dry',         21770,      '2025-11-02'),
  ('40ft Standard Dry',         26780,      '2025-11-06'),
  ('40ft High Cube Dry',        26460,      '2025-11-06'),
  ('20ft Standard Dry',         21770,      '2025-11-06'),
  ('40ft Flat Rack',            39200,      '2025-11-10'),
  ('40ft Standard Dry',         26780,      '2025-11-14'),
  ('20ft Open Top',             21600,      '2025-11-14'),
  ('40ft Standard Dry',         26780,      '2025-11-18'),
  ('40ft High Cube Dry',        26460,      '2025-11-22'),
  ('40ft Standard Dry',         26780,      '2025-11-22'),
  ('20ft Standard Dry',         21770,      '2025-11-26'),
  ('40ft Standard Dry',         26780,      '2025-11-30'),
  ('40ft Standard Dry',         26780,      '2025-12-17'),
  ('40ft High Cube Dry',        26460,      '2025-12-17'),
  ('40ft Flat Rack',            39200,      '2025-12-20'),
  ('40ft Standard Dry',         26780,      '2025-12-20'),
  ('20ft Standard Dry',         21770,      '2025-12-23'),
  ('40ft High Cube Dry',        26460,      '2025-12-27'),
  ('40ft Standard Dry',         26780,      '2026-01-05'),
  ('40ft High Cube Dry',        26460,      '2026-01-05'),
  ('20ft Refrigerated',         21250,      '2026-01-05'),
  ('40ft Standard Dry',         26780,      '2026-01-10'),
  ('40ft High Cube Dry',        26460,      '2026-01-10'),
  ('40ft High Cube Dry',        26460,      '2026-01-15'),
  ('20ft Standard Dry',         21770,      '2026-01-15'),
  ('40ft Standard Dry',         26780,      '2026-01-20'),
  ('40ft High Cube Dry',        26460,      '2026-01-20'),
  ('40ft Standard Dry',         26780,      '2026-01-20'),
  ('40ft Standard Dry',         26780,      '2026-01-25'),
  ('20ft Standard Dry',         21770,      '2026-01-30'),
  ('40ft Refrigerated',         26280,      '2026-01-30'),
  ('40ft Standard Dry',         26780,      '2026-02-03'),
  ('20ft Standard Dry',         21770,      '2026-02-03'),
  ('40ft High Cube Dry',        26460,      '2026-02-08'),
  ('40ft Standard Dry',         26780,      '2026-02-13'),
  ('40ft High Cube Dry',        26460,      '2026-02-13'),
  ('20ft Standard Dry',         21770,      '2026-02-18'),
  ('40ft Standard Dry',         26780,      '2026-02-23'),
  ('40ft Standard Dry',         26780,      '2026-02-28'),
  ('20ft Refrigerated',         21250,      '2026-02-28'),
  ('20ft Standard Dry',         21770,      '2026-03-11'),
  ('40ft Standard Dry',         26780,      '2026-03-15'),
  ('40ft High Cube Dry',        26460,      '2026-03-19'),
  ('40ft Standard Dry',         26780,      '2026-03-23'),
  ('40ft High Cube Dry',        26460,      '2026-03-23'),
  ('40ft Standard Dry',         26780,      '2026-03-27'),
  ('40ft Standard Dry',         26780,      '2026-03-31'),
  ('20ft Refrigerated',         21250,      '2026-03-31'),
  ('40ft Standard Dry',         26780,      '2026-04-12'),
  ('40ft High Cube Dry',        26460,      '2026-04-12'),
  ('20ft Standard Dry',         21770,      '2026-04-12')
) AS v(ctype, cap, sdate)
JOIN shipments s ON s.shipment_date = v.sdate;

-- Unassigned containers (available in yards)
INSERT INTO containers(container_type, max_capacity, shipment_id) VALUES
  ('20ft Standard Dry',   21770, NULL),
  ('20ft Standard Dry',   21770, NULL),
  ('40ft Standard Dry',   26780, NULL),
  ('40ft Standard Dry',   26780, NULL),
  ('40ft High Cube Dry',  26460, NULL),
  ('40ft High Cube Dry',  26460, NULL),
  ('20ft Refrigerated',   21250, NULL),
  ('40ft Refrigerated',   26280, NULL),
  ('20ft Open Top',       21600, NULL),
  ('40ft Flat Rack',      39200, NULL),
  ('40ft Flat Rack',      39200, NULL),
  ('20ft Standard Dry',   21770, NULL);

-- CONTAINER-CARGO links
INSERT INTO container_cargo(cargo_id, container_id)
SELECT ci.cargo_id, ct.container_id
FROM (VALUES
  ('Consumer Electronics Pallets'::TEXT, '2025-10-05'::DATE, '40ft Standard Dry'::TEXT),
  ('Korean Semiconductor Wafers',       '2025-10-05',        '40ft High Cube Dry'),
  ('Consumer Electronics Pallets',      '2025-10-08',        '40ft Standard Dry'),
  ('Polyethylene Pellets',              '2025-10-08',        '20ft Standard Dry'),
  ('Consumer Electronics Pallets',      '2025-10-12',        '40ft High Cube Dry'),
  ('All-Season Tire Pallets',           '2025-10-12',        '40ft Standard Dry'),
  ('Korean Semiconductor Wafers',       '2025-10-15',        '40ft High Cube Dry'),
  ('German Optical Instruments',        '2025-10-18',        '40ft Standard Dry'),
  ('Norwegian Farmed Shrimp',           '2025-10-18',        '20ft Refrigerated'),
  ('Automotive Engine Blocks',          '2025-10-22',        '40ft Standard Dry'),
  ('Japanese Auto Parts Crate',         '2025-10-25',        '40ft High Cube Dry'),
  ('CNC Milling Machine',              '2025-10-25',        '20ft Standard Dry'),
  ('Colombian Coffee Sacks',           '2025-10-28',        '40ft Standard Dry'),
  ('Brazilian Soybean Bulk',            '2025-10-28',        '40ft High Cube Dry'),
  ('Indian Basmati Rice',              '2025-11-06',        '40ft Standard Dry'),
  ('Raw Cotton Bales',                 '2025-11-06',        '40ft High Cube Dry'),
  ('Pharmaceutical Crates',            '2025-11-06',        '20ft Standard Dry'),
  ('Italian Carrara Marble',           '2025-11-10',        '40ft Flat Rack'),
  ('Chilean Copper Cathodes',          '2025-11-14',        '40ft Standard Dry'),
  ('Australian Merino Wool',           '2025-11-18',        '40ft Standard Dry'),
  ('Consumer Electronics Pallets',     '2025-11-22',        '40ft High Cube Dry'),
  ('Flat-Pack Furniture Sets',         '2025-11-22',        '40ft Standard Dry'),
  ('Thai Natural Rubber Bales',        '2025-11-26',        '20ft Standard Dry'),
  ('Softwood Lumber Bundle',           '2025-11-30',        '40ft Standard Dry'),
  ('Hot-Rolled Steel Coils',           '2025-12-17',        '40ft Standard Dry'),
  ('German Optical Instruments',       '2025-12-17',        '40ft High Cube Dry'),
  ('Italian Carrara Marble',           '2025-12-20',        '40ft Flat Rack'),
  ('Okanagan Ice Wine Cases',          '2025-12-20',        '40ft Standard Dry'),
  ('Pharmaceutical Crates',            '2026-01-05',        '40ft Standard Dry'),
  ('Hot-Rolled Steel Coils',           '2026-01-05',        '40ft High Cube Dry'),
  ('Norwegian Farmed Shrimp',          '2026-01-05',        '20ft Refrigerated'),
  ('Consumer Electronics Pallets',     '2026-01-10',        '40ft Standard Dry'),
  ('Polyethylene Pellets',             '2026-01-10',        '40ft High Cube Dry'),
  ('Korean Semiconductor Wafers',      '2026-01-15',        '40ft High Cube Dry'),
  ('Japanese Auto Parts Crate',        '2026-01-15',        '20ft Standard Dry'),
  ('Colombian Coffee Sacks',          '2026-02-13',        '40ft Standard Dry'),
  ('Brazilian Soybean Bulk',           '2026-02-13',        '40ft High Cube Dry'),
  ('Australian Merino Wool',           '2026-02-28',        '40ft Standard Dry'),
  ('Consumer Electronics Pallets',     '2026-03-23',        '40ft Standard Dry'),
  ('Flat-Pack Furniture Sets',         '2026-03-23',        '40ft High Cube Dry'),
  ('Consumer Electronics Pallets',     '2026-04-12',        '40ft Standard Dry'),
  ('Hot-Rolled Steel Coils',           '2026-04-12',        '40ft High Cube Dry'),
  ('Polyethylene Pellets',             '2026-04-12',        '20ft Standard Dry')
) AS v(cargo_name, sdate, ctype)
JOIN cargo_items ci ON ci.cargo_type = v.cargo_name
JOIN containers  ct ON ct.container_type = v.ctype
JOIN shipments   s  ON s.shipment_id = ct.shipment_id AND s.shipment_date = v.sdate;

-- Disable audit trigger during seed to avoid 45 NULL-user_id audit rows
ALTER TABLE inventory_records DISABLE TRIGGER inventory_records_audit;

-- INVENTORY RECORDS
INSERT INTO inventory_records(cargo_id, warehouse_id, quantity_stored, last_updated)
SELECT ci.cargo_id, w.warehouse_id, v.qty, v.ts::TIMESTAMPTZ
FROM (VALUES
  ('Consumer Electronics Pallets'::TEXT, 'Calgary Central Warehouse'::TEXT,   45,  '2026-03-15 10:30:00'::TEXT),
  ('Softwood Lumber Bundle',            'Calgary Central Warehouse',         120, '2026-03-14 08:00:00'),
  ('Canadian Hard Red Wheat',           'Calgary Central Warehouse',          80, '2026-03-10 11:45:00'),
  ('Crude Oil Drum Pallet',             'Calgary Central Warehouse',          35, '2026-03-12 14:20:00'),
  ('All-Season Tire Pallets',           'Calgary Central Warehouse',          60, '2026-03-08 09:15:00'),
  ('Consumer Electronics Pallets',      'Vancouver Logistics Park',          200, '2026-03-16 07:00:00'),
  ('Softwood Lumber Bundle',            'Vancouver Logistics Park',          300, '2026-03-15 16:30:00'),
  ('Korean Semiconductor Wafers',       'Vancouver Logistics Park',           85, '2026-03-14 13:00:00'),
  ('Japanese Auto Parts Crate',         'Vancouver Logistics Park',           40, '2026-03-13 10:45:00'),
  ('Fresh BC Blueberries',              'Vancouver Logistics Park',           90, '2026-03-16 06:00:00'),
  ('Automotive Engine Blocks',          'Toronto Brampton DC',                65, '2026-03-15 09:00:00'),
  ('Consumer Electronics Pallets',      'Toronto Brampton DC',               150, '2026-03-14 14:30:00'),
  ('Pharmaceutical Crates',             'Toronto Brampton DC',                70, '2026-03-12 11:00:00'),
  ('MRI Scanner Unit',                  'Toronto Brampton DC',                 8, '2026-03-10 16:00:00'),
  ('Newsprint Paper Rolls',             'Toronto Brampton DC',                55, '2026-03-11 08:30:00'),
  ('Frozen Atlantic Salmon',            'Montreal Dorval Warehouse',          80, '2026-03-15 05:30:00'),
  ('Norwegian Farmed Shrimp',           'Montreal Dorval Warehouse',          45, '2026-03-14 06:00:00'),
  ('German Optical Instruments',        'Montreal Dorval Warehouse',          30, '2026-03-13 09:15:00'),
  ('Okanagan Ice Wine Cases',           'Montreal Dorval Warehouse',          25, '2026-03-12 10:00:00'),
  ('Crude Oil Drum Pallet',             'Edmonton Logistics Centre',         200, '2026-03-14 07:00:00'),
  ('Canadian Hard Red Wheat',           'Edmonton Logistics Centre',         150, '2026-03-13 12:00:00'),
  ('Polyethylene Pellets',              'Edmonton Logistics Centre',          90, '2026-03-11 14:00:00'),
  ('Canadian Hard Red Wheat',           'Winnipeg Distribution Centre',      250, '2026-03-15 08:00:00'),
  ('Softwood Lumber Bundle',            'Winnipeg Distribution Centre',       75, '2026-03-14 10:30:00'),
  ('Pharmaceutical Crates',             'Ottawa South Warehouse',             40, '2026-03-13 11:30:00'),
  ('Consumer Electronics Pallets',      'Ottawa South Warehouse',             20, '2026-03-12 15:00:00'),
  ('Hot-Rolled Steel Coils',            'Rotterdam Hub Warehouse',           180, '2026-03-16 06:00:00'),
  ('Automotive Engine Blocks',          'Rotterdam Hub Warehouse',           100, '2026-03-15 07:30:00'),
  ('Italian Carrara Marble',            'Rotterdam Hub Warehouse',            25, '2026-03-14 09:00:00'),
  ('Chilean Copper Cathodes',           'Rotterdam Hub Warehouse',            40, '2026-03-13 11:00:00'),
  ('Indian Basmati Rice',               'Rotterdam Hub Warehouse',            60, '2026-03-12 13:00:00'),
  ('Consumer Electronics Pallets',      'Shanghai Bonded Warehouse',         500, '2026-03-16 02:00:00'),
  ('Polyethylene Pellets',              'Shanghai Bonded Warehouse',         300, '2026-03-15 03:00:00'),
  ('CNC Milling Machine',              'Shanghai Bonded Warehouse',          15, '2026-03-14 04:30:00'),
  ('Flat-Pack Furniture Sets',          'Shanghai Bonded Warehouse',         200, '2026-03-13 01:00:00'),
  ('Thai Natural Rubber Bales',         'Singapore FTZ Warehouse',           120, '2026-03-16 04:00:00'),
  ('Australian Merino Wool',            'Singapore FTZ Warehouse',            55, '2026-03-15 05:00:00'),
  ('Consumer Electronics Pallets',      'Singapore FTZ Warehouse',           180, '2026-03-14 06:30:00'),
  ('Indian Basmati Rice',               'Dubai Jebel Ali Warehouse',          90, '2026-03-15 08:00:00'),
  ('Raw Cotton Bales',                  'Dubai Jebel Ali Warehouse',          70, '2026-03-14 09:30:00'),
  ('Copper Wire Spools',                'Dubai Jebel Ali Warehouse',          45, '2026-03-13 10:00:00'),
  ('Consumer Electronics Pallets',      'Los Angeles Gateway Warehouse',     350, '2026-03-16 09:00:00'),
  ('Korean Semiconductor Wafers',       'Los Angeles Gateway Warehouse',      60, '2026-03-15 10:00:00'),
  ('All-Season Tire Pallets',           'Los Angeles Gateway Warehouse',      80, '2026-03-14 11:30:00'),
  ('Colombian Coffee Sacks',            'Los Angeles Gateway Warehouse',      40, '2026-03-13 14:00:00')
) AS v(cargo_name, wh_name, qty, ts)
JOIN cargo_items ci ON ci.cargo_type = v.cargo_name
JOIN warehouses  w  ON w.name = v.wh_name
ON CONFLICT (cargo_id, warehouse_id) DO UPDATE SET
  quantity_stored = EXCLUDED.quantity_stored,
  last_updated    = EXCLUDED.last_updated;

-- Re-enable audit trigger for runtime use
ALTER TABLE inventory_records ENABLE TRIGGER inventory_records_audit;

-- AUDIT LOGS: seed with random user_ids (1-6) matching each inventory record
INSERT INTO audit_logs(user_id, action_type, entity_type, entity_id, payload, created_at)
SELECT
  1 + floor(random() * 6)::INT,
  'INSERT',
  'inventory_records',
  NULL,
  JSONB_BUILD_OBJECT(
    'warehouse_id', ir.warehouse_id,
    'cargo_id', ir.cargo_id,
    'quantity_stored', ir.quantity_stored
  ),
  ir.last_updated
FROM inventory_records ir;

COMMIT;
