-- Add test festival days with different cutoff times
INSERT INTO fantasy_festival_days (id, name, day_number, date, is_published, cutoff_time)
VALUES 
  ('test-day-1', 'Test Day 1 (Past Cutoff)', 1, CURRENT_DATE - INTERVAL '1 day', true, CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('test-day-2', 'Test Day 2 (Future Cutoff)', 2, CURRENT_DATE + INTERVAL '1 day', true, CURRENT_TIMESTAMP + INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  day_number = EXCLUDED.day_number,
  date = EXCLUDED.date,
  is_published = EXCLUDED.is_published,
  cutoff_time = EXCLUDED.cutoff_time;

-- Add races for Test Day 1 (Past Cutoff)
INSERT INTO fantasy_races (id, name, race_time, day_id, race_order, status, distance, number_of_places)
VALUES
  ('test-race-1-1', 'Race 1 - Test Day 1', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '13 hours', 'test-day-1', 1, 'upcoming', '2m 110y', 3),
  ('test-race-1-2', 'Race 2 - Test Day 1', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '14 hours', 'test-day-1', 2, 'upcoming', '4m 220y', 3),
  ('test-race-1-3', 'Race 3 - Test Day 1', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '15 hours', 'test-day-1', 3, 'upcoming', '6m 330y', 3)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  race_time = EXCLUDED.race_time,
  day_id = EXCLUDED.day_id,
  race_order = EXCLUDED.race_order,
  status = EXCLUDED.status,
  distance = EXCLUDED.distance,
  number_of_places = EXCLUDED.number_of_places;

-- Add races for Test Day 2 (Future Cutoff)
INSERT INTO fantasy_races (id, name, race_time, day_id, race_order, status, distance, number_of_places)
VALUES
  ('test-race-2-1', 'Race 1 - Test Day 2', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '13 hours', 'test-day-2', 1, 'upcoming', '2m 110y', 3),
  ('test-race-2-2', 'Race 2 - Test Day 2', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours', 'test-day-2', 2, 'upcoming', '4m 220y', 3),
  ('test-race-2-3', 'Race 3 - Test Day 2', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours', 'test-day-2', 3, 'upcoming', '6m 330y', 3)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  race_time = EXCLUDED.race_time,
  day_id = EXCLUDED.day_id,
  race_order = EXCLUDED.race_order,
  status = EXCLUDED.status,
  distance = EXCLUDED.distance,
  number_of_places = EXCLUDED.number_of_places;

-- Add horses for Race 1 - Test Day 1
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-1-1-1', 'test-race-1-1', 'Galloping Glory 1', 2.50, 10, 5),
  ('test-horse-1-1-2', 'test-race-1-1', 'Thunder Hooves 1', 3.75, 10, 5),
  ('test-horse-1-1-3', 'test-race-1-1', 'Swift Stride 1', 5.00, 10, 5),
  ('test-horse-1-1-4', 'test-race-1-1', 'Mighty Mane 1', 8.50, 10, 5),
  ('test-horse-1-1-5', 'test-race-1-1', 'Royal Runner 1', 12.00, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;

-- Add horses for Race 2 - Test Day 1
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-1-2-1', 'test-race-1-2', 'Dashing Dasher 1', 1.75, 10, 5),
  ('test-horse-1-2-2', 'test-race-1-2', 'Blazing Bolt 1', 4.25, 10, 5),
  ('test-horse-1-2-3', 'test-race-1-2', 'Nimble Neigh 1', 6.50, 10, 5),
  ('test-horse-1-2-4', 'test-race-1-2', 'Valiant Venture 1', 9.00, 10, 5),
  ('test-horse-1-2-5', 'test-race-1-2', 'Stellar Steed 1', 15.00, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;

-- Add horses for Race 3 - Test Day 1
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-1-3-1', 'test-race-1-3', 'Galloping Glory 2', 3.25, 10, 5),
  ('test-horse-1-3-2', 'test-race-1-3', 'Thunder Hooves 2', 5.50, 10, 5),
  ('test-horse-1-3-3', 'test-race-1-3', 'Swift Stride 2', 7.75, 10, 5),
  ('test-horse-1-3-4', 'test-race-1-3', 'Mighty Mane 2', 10.00, 10, 5),
  ('test-horse-1-3-5', 'test-race-1-3', 'Royal Runner 2', 18.50, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;

-- Add horses for Race 1 - Test Day 2
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-2-1-1', 'test-race-2-1', 'Dashing Dasher 2', 2.00, 10, 5),
  ('test-horse-2-1-2', 'test-race-2-1', 'Blazing Bolt 2', 4.50, 10, 5),
  ('test-horse-2-1-3', 'test-race-2-1', 'Nimble Neigh 2', 6.25, 10, 5),
  ('test-horse-2-1-4', 'test-race-2-1', 'Valiant Venture 2', 9.75, 10, 5),
  ('test-horse-2-1-5', 'test-race-2-1', 'Stellar Steed 2', 14.50, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;

-- Add horses for Race 2 - Test Day 2
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-2-2-1', 'test-race-2-2', 'Galloping Glory 3', 3.00, 10, 5),
  ('test-horse-2-2-2', 'test-race-2-2', 'Thunder Hooves 3', 5.25, 10, 5),
  ('test-horse-2-2-3', 'test-race-2-2', 'Swift Stride 3', 7.50, 10, 5),
  ('test-horse-2-2-4', 'test-race-2-2', 'Mighty Mane 3', 11.25, 10, 5),
  ('test-horse-2-2-5', 'test-race-2-2', 'Royal Runner 3', 16.75, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;

-- Add horses for Race 3 - Test Day 2
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, points_if_wins, points_if_places)
VALUES
  ('test-horse-2-3-1', 'test-race-2-3', 'Dashing Dasher 3', 2.25, 10, 5),
  ('test-horse-2-3-2', 'test-race-2-3', 'Blazing Bolt 3', 4.75, 10, 5),
  ('test-horse-2-3-3', 'test-race-2-3', 'Nimble Neigh 3', 6.75, 10, 5),
  ('test-horse-2-3-4', 'test-race-2-3', 'Valiant Venture 3', 10.50, 10, 5),
  ('test-horse-2-3-5', 'test-race-2-3', 'Stellar Steed 3', 17.25, 10, 5)
ON CONFLICT (id) DO UPDATE
SET 
  race_id = EXCLUDED.race_id,
  name = EXCLUDED.name,
  fixed_odds = EXCLUDED.fixed_odds,
  points_if_wins = EXCLUDED.points_if_wins,
  points_if_places = EXCLUDED.points_if_places;
