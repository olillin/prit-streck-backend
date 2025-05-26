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

-- Group 2 items
INSERT INTO items(group_id, display_name)
VALUES (2, 'Fredag''s läskiga dryck');
INSERT INTO prices(item_id, price, display_name)
VALUES (1, 16, 'De som vågar');

-- Group 1 items
INSERT INTO items(group_id, display_name)
VALUES (1, 'Fanta');
INSERT INTO prices(item_id, price, display_name)
VALUES (2, 7, 'P.R.I.T.');

INSERT INTO items(group_id, display_name, icon_url)
VALUES (1, 'Coca-Cola', 'https://product-cdn.systembolaget.se/productimages/507795/507795_400.png');
INSERT INTO prices(item_id, price, display_name)
VALUES (3, 10, 'P.R.I.T.');
INSERT INTO prices(item_id, price, display_name)
VALUES (3, 12, 'Pateter');
INSERT INTO prices(item_id, price, display_name)
VALUES (3, 15, 'Extern');

-- Group 1 transactions
INSERT INTO purchases(group_id, created_by, created_for)
VALUES (1, 1, 1);
INSERT INTO purchased_items
(transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
VALUES (1, 2, 'Fanta Orange', 7, 'P.R.I.T.', 2);

INSERT INTO purchases(group_id, created_by, created_for)
VALUES (1, 1, 2);
INSERT INTO purchased_items
(transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
VALUES (2, 3, 'Coca-Cola', 10, 'P.R.I.T.', 3);
INSERT INTO purchased_items
(transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
VALUES (2, 2, 'Fanta Orange', 7, 'P.R.I.T.', 1);

INSERT INTO deposits(group_id, created_by, created_for, total)
VALUES (1, 1, 1, 250);

INSERT INTO favorite_items(user_id, item_id)
VALUES (1, 2);

-- Group 2 transactions
INSERT INTO purchases(group_id, created_by, created_for)
VALUES (2, 3, 4);
INSERT INTO purchased_items(transaction_id, item_id, display_name, purchase_price, purchase_price_name,
                            quantity)
VALUES (4, 1, 'Fredag''s läskiga dryck', 16, 'De som vågar', 1);

INSERT INTO stock_updates(group_id, created_by)
VALUES (2, 4);
INSERT INTO item_stock_updates(transaction_id, item_id, after)
VALUES (5, 1, 5);

INSERT INTO stock_updates(group_id, created_by, comment)
VALUES (2, 3, 'Fredag gjorde mer dryck');
INSERT INTO item_stock_updates(transaction_id, item_id, after)
VALUES (6, 1, 10);

INSERT INTO purchases(group_id, created_by, created_for)
VALUES (2, 3, 3);
INSERT INTO purchased_items(transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
VALUES (7, 1, 'Fredag''s läskiga dryck', 16, 'De som vågar', 2);
