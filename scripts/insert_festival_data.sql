-- Insert horses for Day 1 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
  -- Sky Bet Supreme Novices' Hurdle Race (Grade 1)
  (gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Ballyburn', 1.8, null),
  (gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Ile Atlantique', 4.5, null),
  (gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Mystical Power', 6.0, null),

  -- My Pension Expert Arkle Novices' Chase (Grade 1)
  (gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Marine Nationale', 2.5, null),
  (gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Gaelic Warrior', 4.0, null),
  (gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Found A Fifty', 6.0, null),

  -- Ultima Handicap Chase (Premier Handicap)
  (gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Meetingofthewaters', 4.0, null),
  (gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Corach Rambler', 6.0, null),
  (gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Fastorslow', 8.0, null),

  -- Close Brothers Mares' Hurdle Race (Grade 1)
  (gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Lossiemouth', 2.0, null),
  (gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Ashroe Diamond', 5.0, null),
  (gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Marie''s Rock', 6.0, null),

  -- Unibet Champion Hurdle (Grade 1)
  (gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'State Man', 1.5, null),
  (gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Irish Point', 4.0, null),
  (gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Not So Sleepy', 8.0, null),

  -- Boodles Juvenile Handicap Hurdle (Premier Handicap)
  (gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Kargese', 4.0, null),
  (gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Lark In The Mornin', 5.0, null),
  (gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Ndaawi', 6.0, null),

  -- National Hunt Novices' Chase
  (gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Embassy Gardens', 3.0, null),
  (gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Corbetts Cross', 4.0, null),
  (gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Minella Cocooner', 6.0, null);

-- Insert test horses for Day 2 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
  -- Ballymore Novices Hurdle
  (gen_random_uuid(), '7441333b-0a3b-4f64-b19a-af236750c9a6', 'Ballyburn', 1.8, null),
  (gen_random_uuid(), '7441333b-0a3b-4f64-b19a-af236750c9a6', 'Ile Atlantique', 4.5, null),
  (gen_random_uuid(), '7441333b-0a3b-4f64-b19a-af236750c9a6', 'Readin Tommy Wrong', 6.0, null),
  (gen_random_uuid(), '7441333b-0a3b-4f64-b19a-af236750c9a6', 'Firefox', 8.0, null),

  -- Brown Advisory Novices' Steeple Chase
  (gen_random_uuid(), 'e81cbe38-eca9-4f55-83c4-8de741770037', 'Stay Away Fay', 3.0, null),
  (gen_random_uuid(), 'e81cbe38-eca9-4f55-83c4-8de741770037', 'Fact To File', 3.5, null),
  (gen_random_uuid(), 'e81cbe38-eca9-4f55-83c4-8de741770037', 'Monty''s Star', 6.0, null),
  (gen_random_uuid(), 'e81cbe38-eca9-4f55-83c4-8de741770037', 'Nick Rockett', 8.0, null),

  -- Coral Cup Handicap Hurdle
  (gen_random_uuid(), '25000899-dbad-4d58-b3c5-2bd62bf1e21e', 'Langer Dan', 5.0, null),
  (gen_random_uuid(), '25000899-dbad-4d58-b3c5-2bd62bf1e21e', 'Sa Majeste', 6.0, null),
  (gen_random_uuid(), '25000899-dbad-4d58-b3c5-2bd62bf1e21e', 'Might I', 8.0, null),
  (gen_random_uuid(), '25000899-dbad-4d58-b3c5-2bd62bf1e21e', 'Path D''oroux', 10.0, null),

  -- BetMGM Queen Mother Champion Steeple Chase (Grade 1)
  (gen_random_uuid(), '1fd703f4-47a1-454c-8ae9-c29e09494089', 'El Fabiolo', 1.8, null),
  (gen_random_uuid(), '1fd703f4-47a1-454c-8ae9-c29e09494089', 'Jonbon', 3.5, null),
  (gen_random_uuid(), '1fd703f4-47a1-454c-8ae9-c29e09494089', 'Edwardstone', 7.0, null),
  (gen_random_uuid(), '1fd703f4-47a1-454c-8ae9-c29e09494089', 'Captain Guinness', 12.0, null),

  -- Glenfarclas Cross Country Handicap Chase
  (gen_random_uuid(), '49eb1707-d550-4ac7-9c9c-359d926eee22', 'Minella Indo', 3.0, null),
  (gen_random_uuid(), '49eb1707-d550-4ac7-9c9c-359d926eee22', 'Delta Work', 4.0, null),
  (gen_random_uuid(), '49eb1707-d550-4ac7-9c9c-359d926eee22', 'Galvin', 6.0, null),
  (gen_random_uuid(), '49eb1707-d550-4ac7-9c9c-359d926eee22', 'Franco De Port', 8.0, null),

  -- Grand Annual Handicap Chase
  (gen_random_uuid(), '020336a8-0373-42e8-8571-4b1f52ca70a5', 'Libberty Hunter', 4.0, null),
  (gen_random_uuid(), '020336a8-0373-42e8-8571-4b1f52ca70a5', 'Master Chewy', 5.0, null),
  (gen_random_uuid(), '020336a8-0373-42e8-8571-4b1f52ca70a5', 'Saint Segal', 7.0, null),
  (gen_random_uuid(), '020336a8-0373-42e8-8571-4b1f52ca70a5', 'Unexpected Party', 9.0, null),

  -- Weatherbys Champion Bumper (Open NH Flat Race)
  (gen_random_uuid(), '93dc1c09-360f-480f-92d1-d192ab6b3d55', 'Romeo Coolio', 3.5, null),
  (gen_random_uuid(), '93dc1c09-360f-480f-92d1-d192ab6b3d55', 'Jalon D''oudairies', 4.5, null),
  (gen_random_uuid(), '93dc1c09-360f-480f-92d1-d192ab6b3d55', 'Redemption Day', 6.0, null),
  (gen_random_uuid(), '93dc1c09-360f-480f-92d1-d192ab6b3d55', 'Jeroboam Machin', 8.0, null);

-- Insert test horses for Day 3 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
  -- Ryanair Mares' Novices' Hurdle (Grade 2)
  (gen_random_uuid(), '54618825-2212-4468-9ee5-32557da30a3b', 'Facile Vega', 2.5, null),
  (gen_random_uuid(), '54618825-2212-4468-9ee5-32557da30a3b', 'Grey Dawning', 4.0, null),
  (gen_random_uuid(), '54618825-2212-4468-9ee5-32557da30a3b', 'Ginny''s Destiny', 6.0, null),
  (gen_random_uuid(), '54618825-2212-4468-9ee5-32557da30a3b', 'Letsbeclearaboutit', 8.0, null),

  -- Jack Richards Novices' Limited Handicap Chase
  (gen_random_uuid(), '45ed87fb-7e36-43b0-9bf5-67a0f50d7f99', 'Perceval Legallois', 4.0, null),
  (gen_random_uuid(), '45ed87fb-7e36-43b0-9bf5-67a0f50d7f99', 'Springwell Bay', 5.0, null),
  (gen_random_uuid(), '45ed87fb-7e36-43b0-9bf5-67a0f50d7f99', 'Walking On Air', 7.0, null),
  (gen_random_uuid(), '45ed87fb-7e36-43b0-9bf5-67a0f50d7f99', 'Icare Allen', 9.0, null),

  -- Pertemps Final Handicap Hurdle
  (gen_random_uuid(), 'dbd2f211-a4bb-49b6-ae36-efd92feb9f95', 'Envoi Allen', 3.0, null),
  (gen_random_uuid(), 'dbd2f211-a4bb-49b6-ae36-efd92feb9f95', 'Stage Star', 4.0, null),
  (gen_random_uuid(), 'dbd2f211-a4bb-49b6-ae36-efd92feb9f95', 'Pic Dorhy', 6.0, null),
  (gen_random_uuid(), 'dbd2f211-a4bb-49b6-ae36-efd92feb9f95', 'Banbridge', 8.0, null),

  -- Ryanair Chase (Grade 1)
  (gen_random_uuid(), '17cf3cd8-6f30-4e41-8482-d2c7b935b18b', 'Teahupoo', 2.0, null),
  (gen_random_uuid(), '17cf3cd8-6f30-4e41-8482-d2c7b935b18b', 'Home By The Lee', 5.0, null),
  (gen_random_uuid(), '17cf3cd8-6f30-4e41-8482-d2c7b935b18b', 'Sire Du Berlais', 7.0, null),
  (gen_random_uuid(), '17cf3cd8-6f30-4e41-8482-d2c7b935b18b', 'Paisley Park', 10.0, null),

  -- Paddy Power Stayers' Hurdle (Grade 1)
  (gen_random_uuid(), '91dce43d-2598-4cf8-b699-12f59af19dca', 'Absurde', 5.0, null),
  (gen_random_uuid(), '91dce43d-2598-4cf8-b699-12f59af19dca', 'King Of Kingsfield', 6.0, null),
  (gen_random_uuid(), '91dce43d-2598-4cf8-b699-12f59af19dca', 'Zenta', 8.0, null),
  (gen_random_uuid(), '91dce43d-2598-4cf8-b699-12f59af19dca', 'L''Eau Du Sud', 10.0, null),

  -- TrustATrader Plate Handicap Chase
  (gen_random_uuid(), '616dae6e-ca7f-4461-baf4-cefe37922bd1', 'Jade De Grugy', 3.0, null),
  (gen_random_uuid(), '616dae6e-ca7f-4461-baf4-cefe37922bd1', 'Brighterdaysahead', 4.0, null),
  (gen_random_uuid(), '616dae6e-ca7f-4461-baf4-cefe37922bd1', 'Birdie Or Bust', 6.0, null),
  (gen_random_uuid(), '616dae6e-ca7f-4461-baf4-cefe37922bd1', 'Dysart Enos', 8.0, null),

  -- Fulke Walwyn Kim Muir Challenge Cup
  (gen_random_uuid(), 'e5bcf5e2-1a01-43bd-8f68-4f7c767c8f96', 'Inothewayurthinkin', 4.0, null),
  (gen_random_uuid(), 'e5bcf5e2-1a01-43bd-8f68-4f7c767c8f96', 'Dunboyne', 5.0, null),
  (gen_random_uuid(), 'e5bcf5e2-1a01-43bd-8f68-4f7c767c8f96', 'Chambard', 7.0, null),
  (gen_random_uuid(), 'e5bcf5e2-1a01-43bd-8f68-4f7c767c8f96', 'Beauport', 9.0, null);

-- Insert test horses for Day 4 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
  -- JCB Triumph Hurdle (Grade 1)
  (gen_random_uuid(), '76923595-74e6-479a-bced-e5f6d6ff5c66', 'Sir Gino', 2.0, null),
  (gen_random_uuid(), '76923595-74e6-479a-bced-e5f6d6ff5c66', 'Burdett Road', 4.5, null),
  (gen_random_uuid(), '76923595-74e6-479a-bced-e5f6d6ff5c66', 'Storm Heart', 6.0, null),
  (gen_random_uuid(), '76923595-74e6-479a-bced-e5f6d6ff5c66', 'Kargese', 8.0, null),

  -- William Hill County Handicap Hurdle
  (gen_random_uuid(), '28779f26-5059-44da-a73b-5871744e06c4', 'Iberico Lord', 4.0, null),
  (gen_random_uuid(), '28779f26-5059-44da-a73b-5871744e06c4', 'First Street', 5.0, null),
  (gen_random_uuid(), '28779f26-5059-44da-a73b-5871744e06c4', 'Nemean Lion', 7.0, null),
  (gen_random_uuid(), '28779f26-5059-44da-a73b-5871744e06c4', 'Pembroke', 9.0, null),

  -- Mrs Paddy Power Mares' Chase (Grade 2)
  (gen_random_uuid(), '60734330-0a96-4a07-9116-5601d5138d1c', 'Limerick Lace', 3.0, null),
  (gen_random_uuid(), '60734330-0a96-4a07-9116-5601d5138d1c', 'Dinoblue', 4.0, null),
  (gen_random_uuid(), '60734330-0a96-4a07-9116-5601d5138d1c', 'Allegorie De Vassy', 6.0, null),
  (gen_random_uuid(), '60734330-0a96-4a07-9116-5601d5138d1c', 'Riviere D''etel', 8.0, null),

  -- Albert Bartlett Novices' Hurdle (Grade 1)
  (gen_random_uuid(), 'c7cc07e1-dbd6-4f20-93ea-603cfec161ed', 'Readin Tommy Wrong', 3.0, null),
  (gen_random_uuid(), 'c7cc07e1-dbd6-4f20-93ea-603cfec161ed', 'Stellar Story', 4.0, null),
  (gen_random_uuid(), 'c7cc07e1-dbd6-4f20-93ea-603cfec161ed', 'Dancing City', 6.0, null),
  (gen_random_uuid(), 'c7cc07e1-dbd6-4f20-93ea-603cfec161ed', 'High Class Hero', 8.0, null),

  -- Boodles Cheltenham Gold Cup Chase (Grade 1)
  (gen_random_uuid(), 'c653d91b-1266-4aa2-8012-aaa681832107', 'Galopin Des Champs', 2.0, null),
  (gen_random_uuid(), 'c653d91b-1266-4aa2-8012-aaa681832107', 'Fastorslow', 4.0, null),
  (gen_random_uuid(), 'c653d91b-1266-4aa2-8012-aaa681832107', 'Gerri Colombe', 6.0, null),
  (gen_random_uuid(), 'c653d91b-1266-4aa2-8012-aaa681832107', 'Shishkin', 8.0, null),

  -- St. James's Place Festival Challenge Cup Open Hunters' Chase
  (gen_random_uuid(), '81bc6c31-c6d4-4d85-b7df-079aea38e740', 'Premier Magic', 3.0, null),
  (gen_random_uuid(), '81bc6c31-c6d4-4d85-b7df-079aea38e740', 'Its On The Line', 4.0, null),
  (gen_random_uuid(), '81bc6c31-c6d4-4d85-b7df-079aea38e740', 'Famous Clermont', 6.0, null),
  (gen_random_uuid(), '81bc6c31-c6d4-4d85-b7df-079aea38e740', 'Ferns Lock', 8.0, null),

  -- Martin Pipe Conditional Jockeys' Handicap Hurdle
  (gen_random_uuid(), '40337958-9697-4bf9-94ae-c27ca5c881d0', 'Quai De Bourbon', 4.0, null),
  (gen_random_uuid(), '40337958-9697-4bf9-94ae-c27ca5c881d0', 'Waterford Whispers', 5.0, null),
  (gen_random_uuid(), '40337958-9697-4bf9-94ae-c27ca5c881d0', 'Spanish Harlem', 7.0, null),
  (gen_random_uuid(), '40337958-9697-4bf9-94ae-c27ca5c881d0', 'Firm Footings', 9.0, null);
