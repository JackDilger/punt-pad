-- Insert horses for Day 1 races
INSERT INTO fantasy_horses (id, race_id, name, fixed_odds, result)
VALUES
-- The Michael O’Sullivan Supreme Novices’ Hurdle (Grade 1)
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Kopek Des Bordes', 2.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Romeo Coolio', 7.5, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Workahead', 10.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Salvator Mundi', 11.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'William Munny', 11.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Irancy', 17.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Tripoli Flyer', 26.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Karbau', 26.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Funiculi Funicula', 41.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Karniquet', 41.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Sky Lord', 67.0, null),
(gen_random_uuid(), '01e8249e-b32b-4b98-9457-30b0f1faf8c7', 'Tutti Quanti', 151.0, null);

-- My Pension Expert Arkle Novices' Chase (Grade 1)
(gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Majborough', 1.57, null),
(gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'L''Eau du Sud', 5.5, null),
(gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Jango Baie', 8.5, null),
(gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Only By Night', 13.0, null),
(gen_random_uuid(), '10bff641-03be-4149-9bf6-292dd7275bc2', 'Touch Me Not', 15.0, null);


-- Ultima Handicap Chase (Premier Handicap)
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'The Changing Man', 14.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Broadway Boy', 16.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Katate Dori', 10.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Crebilly', 12.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Henry''s Friend', 12.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Whistle Stop Tour', 12.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Malina Girl', 15.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Famous Bridge', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'The Short Go', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'King Turgeon', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Victorino', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Search For Glory', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Sequestered', 21.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Myretown', 23.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Happygolucky', 26.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Trelawne', 26.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Grandeur d''Ame', 41.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Richmond Lake', 41.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Stay Away Fay', 41.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Frero Banbou', 51.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Straw Fan Jack', 51.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Zanahiyr', 51.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Farouk d''Alene', 67.0, null),
(gen_random_uuid(), 'd191dd8b-8da7-400f-8859-5ab4d4475935', 'Guard Your Dreams', 67.0, null);

-- Close Brothers Mares' Hurdle Race (Grade 1)
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Lossiemouth', 1.67, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Jade De Grugy', 5.5, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'July Flower', 13.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Joyeuse', 13.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Kala Conti', 17.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Take No Chances', 21.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Dysart Enos', 34.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Jetara', 34.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Queens Gamble', 51.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Gala Marceau', 67.0, null),
(gen_random_uuid(), '6df86e0c-08dc-44a1-8cce-ca0a3df380f5', 'Casa No Mento', 101.0, null);


-- Unibet Champion Hurdle (Grade 1)
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Constitution Hill', 1.62, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Brighterdaysahead', 3.25, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'State Man', 9.0, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Burdett Road', 34.0, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Golden Ace', 51.0, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'Winter Fog', 151.0, null),
(gen_random_uuid(), '46392f05-866d-443a-acc6-b0553eca2ba0', 'King Of Kingsfield', 151.0, null);

  -- The Fred Winter Juvenile Handicap Hurdle Race (Premier Handicap)
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Stencil', 6.5, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Total Look', 7.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Beyond Your Dreams', 14.5, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Puturhandstogether', 11.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Murcia', 13.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Hot Fuss', 15.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Out For A Stroll', 17.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Quantock Hills', 21.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Wendrock', 21.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Sturricane', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Holy See', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Liam Swagger', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Sony Bill', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Teriferma', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Luker''s Tipple', 26.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Solar Drive', 34.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Robbies Rock', 34.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Turn And Finish', 34.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Lavender Hill Mob', 51.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Kool One', 51.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Ephesus', 51.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Static', 51.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Moutarde', 67.0, null),
(gen_random_uuid(), 'c75486d4-e0ad-4887-bf68-853cb3bfbb38', 'Mister Cessna', 67.0, null);


  -- National Hunt Novices' Chase
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Haiti Couleurs', 5.5, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Now Is The Hour', 5.5, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Transmission', 6.5, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Captain Cody', 8.5, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Gericault Roque', 13.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Resplendent Grey', 13.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Will Do', 15.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Hasthing', 17.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Aworkinprogress', 17.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Kyntara', 26.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Herakles Westwood', 26.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Latneightrumble', 26.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Duffle Coat', 41.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Stuzzikini', 41.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'No Time To Wait', 41.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'In d''Or', 41.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Klarc Kent', 51.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Jupiter Allen', 51.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Caesar Rock', 67.0, null),
(gen_random_uuid(), '74d640c8-d076-43c1-bec9-4ac639c33d44', 'Rock My Way', 67.0, null);
