-- Insert test horses for Day 4 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
  -- JCB Triumph Hurdle (Grade 1)
  (gen_random_uuid(), '76923595-74e6-479a-bced-e5f6d6ff5c66', 'Lightning Bolt', 2.5, null),

  -- William Hill County Handicap Hurdle
  (gen_random_uuid(), '28779f26-5059-44da-a73b-5871744e06c4', 'Thunderstrike', 3.0, null),

  -- Mrs Paddy Power Mares' Chase (Grade 2)
  (gen_random_uuid(), '60734330-0a96-4a07-9116-5601d5138d1c', 'Majestic Queen', 4.2, null),

  -- Albert Bartlett Novices' Hurdle (Grade 1)
  (gen_random_uuid(), 'c7cc07e1-dbd6-4f20-93ea-603cfec161ed', 'Speedster', 5.5, null),

  -- Boodles Cheltenham Gold Cup Chase (Grade 1)
  (gen_random_uuid(), 'c653d91b-1266-4aa2-8012-aaa681832107', 'Night Rider', 6.0, null),

  -- St. James's Place Festival Challenge Cup Open Hunters' Chase
  (gen_random_uuid(), '81bc6c31-c6d4-4d85-b7df-079aea38e740', 'Eagle Eye', 2.8, null),

  -- Martin Pipe Conditional Jockeys' Handicap Hurdle
  (gen_random_uuid(), '40337958-9697-4bf9-94ae-c27ca5c881d0', 'Rapid Fire', 3.6, null);
