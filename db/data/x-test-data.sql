-- Group 1
INSERT INTO groups(gamma_id)
VALUES ('3cf94646-2412-4896-bba9-5d2410ac0c62'); -- P.R.I.T.'25
INSERT INTO users(gamma_id, group_id)
VALUES ('7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b', 1); -- Göken
INSERT INTO users(gamma_id, group_id)
VALUES ('b69e01cd-01d1-465e-adc5-99d017b7fd74', 1); -- Cal

-- Group 2
INSERT INTO groups(gamma_id)
VALUES ('8b2ac9fc-22c3-40f8-aa33-89b02d1a260b'); -- P.R.I.T.'24
INSERT INTO users(gamma_id, group_id)
VALUES ('614f7934-3d2e-4452-a4cd-6afca93b66d7', 2); -- Frögg
INSERT INTO users(gamma_id, group_id)
VALUES ('ec202592-50b2-471c-96c6-893493cf724e', 2); -- Fredag

-- Group 1 items
INSERT INTO items(group_id, display_name)
VALUES (1, 'Item 1');
INSERT INTO items(group_id, display_name)
VALUES (1, 'Item 2');

-- Group 2 items
INSERT INTO items(group_id, display_name)
VALUES (2, 'Item 3');
