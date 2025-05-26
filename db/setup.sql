-- Sequences
CREATE SEQUENCE transaction_id;

-- Tables
CREATE TABLE groups
(
    id       SERIAL             NOT NULL,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users
(
    id       SERIAL             NOT NULL,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    group_id INT                NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE items
(
    id           SERIAL       NOT NULL,
    group_id     INT          NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon_url     VARCHAR(500),
    created_time TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    visible      BOOLEAN      NOT NULL DEFAULT 't',
    UNIQUE (group_id, display_name),
    PRIMARY KEY (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE prices
(
    item_id      INT           NOT NULL,
    price        NUMERIC(7, 2) NOT NULL,
    display_name VARCHAR(30)   NOT NULL,
    PRIMARY KEY (item_id, display_name),
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

CREATE TABLE purchases
(
    id           INT         NOT NULL DEFAULT nextval('transaction_id'),
    group_id     INT         NOT NULL,
    created_by   INT         NOT NULL,
    created_for  INT         NOT NULL,
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment      VARCHAR(1000),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (created_for) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE purchased_items
(
    transaction_id      INT           NOT NULL,
    item_id             INT,
    display_name        VARCHAR(100)  NOT NULL,
    icon_url            VARCHAR(500),
    purchase_price      NUMERIC(7, 2) NOT NULL,
    purchase_price_name VARCHAR(30)   NOT NULL,
    quantity            INT           NOT NULL CHECK (quantity >= 1),
    FOREIGN KEY (transaction_id) REFERENCES purchases (id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE SET NULL
);

CREATE TABLE deposits
(
    id           INT           NOT NULL DEFAULT nextval('transaction_id'),
    group_id     INT           NOT NULL,
    created_by   INT           NOT NULL,
    created_for  INT           NOT NULL,
    created_time TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    total        NUMERIC(7, 2) NOT NULL,
    comment      VARCHAR(1000),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (created_for) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE stock_updates
(
    id           INT         NOT NULL DEFAULT nextval('transaction_id'),
    group_id     INT         NOT NULL,
    created_by   INT         NOT NULL,
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment      VARCHAR(1000),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE item_stock_updates
(
    transaction_id INT NOT NULL,
    item_id        INT NOT NULL,
    before         INT NOT NULL,
    after          INT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES stock_updates (id),
    FOREIGN KEY (item_id) REFERENCES items (id)
);

CREATE TABLE favorite_items
(
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    UNIQUE (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Functions
CREATE OR REPLACE FUNCTION times_purchased(id INT)
    RETURNS INT
    LANGUAGE SQL AS
$$
SELECT coalesce((SELECT sum(p.quantity)
                 FROM purchased_items p
                 WHERE p.item_id = id),
                0);
$$;

CREATE OR REPLACE FUNCTION item_stock(id INT)
    RETURNS INT
    LANGUAGE PLPGSQL AS
$$
DECLARE
    last_stock_time TIMESTAMPTZ;
DECLARE
    last_stock_amount INT;
DECLARE
    purchased_after_stock INT;
BEGIN
    SELECT u.created_time, u.after
    INTO last_stock_time, last_stock_amount
    FROM full_stock_updates u
    WHERE u.item_id = item_stock.id
    ORDER BY u.created_time DESC;

    SELECT coalesce(last_stock_time, 'epoch') INTO last_stock_time;
    SELECT coalesce(last_stock_amount, 0) INTO last_stock_amount;

    SELECT coalesce((SELECT SUM(p.quantity)
                     FROM full_purchases p
                     WHERE p.item_id = item_stock.id
                       AND p.created_time >= last_stock_time), 0)
    INTO purchased_after_stock;

    RETURN last_stock_amount - purchased_after_stock;
END;
$$;

CREATE OR REPLACE FUNCTION set_stock_before()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL AS
$$
BEGIN
    NEW.before = item_stock(NEW.item_id);
    return NEW;
END;
$$;

-- Triggers
CREATE TRIGGER set_stock_before_trigger
    BEFORE INSERT
    ON item_stock_updates
    FOR EACH ROW
EXECUTE PROCEDURE set_stock_before();

-- Views
CREATE VIEW full_purchases AS
SELECT p.id,
       p.group_id,
       p.created_by,
       p.created_for,
       p.created_time,
       p.comment,
       i.item_id,
       i.display_name,
       i.icon_url,
       i.purchase_price,
       i.purchase_price_name,
       i.quantity
FROM purchases p
         LEFT JOIN purchased_items i ON p.id = i.transaction_id;

CREATE VIEW full_stock_updates  AS
SELECT u.id,
       u.group_id,
       u.created_by,
       u.created_time,
       u.comment,
       i.item_id,
       i.before,
       i.after
FROM stock_updates u
         LEFT JOIN item_stock_updates i on u.id = i.transaction_id;

CREATE VIEW transactions AS
SELECT id,
       group_id,
       created_by,
       created_time,
       comment,
       'purchase' AS type
FROM purchases
UNION ALL
SELECT id,
       group_id,
       created_by,
       created_time,
       comment,
       'deposit' AS type
FROM deposits
UNION ALL
SELECT id,
       group_id,
       created_by,
       created_time,
       comment,
       'stock_update' AS type
FROM stock_updates;

CREATE VIEW users_total_deposited AS
SELECT u.id,
       u.gamma_id,
       u.group_id,
       coalesce((SELECT sum(total)
                 FROM deposits d
                 WHERE d.created_for = u.id), 0)::NUMERIC(7, 2) AS total
FROM users u;

CREATE VIEW users_total_purchased AS
SELECT u.id,
       u.gamma_id,
       u.group_id,
       coalesce((SELECT sum(p.purchase_price * p.quantity)
                 FROM full_purchases p
                 WHERE p.created_for = u.id), 0)::NUMERIC(7, 2) AS total
FROM users u;

CREATE VIEW user_balances AS
SELECT u.id,
       u.gamma_id,
       u.group_id,
       (SELECT (d.total) FROM users_total_deposited d WHERE d.id = u.id)
           - (SELECT (p.total) FROM users_total_purchased p WHERE p.id = u.id) AS balance
FROM users u;

CREATE VIEW full_user AS
SELECT u.id,
       u.gamma_id,
       u.balance,
       u.group_id,
       g.gamma_id AS group_gamma_id
FROM user_balances u
         LEFT OUTER JOIN groups g on u.group_id = g.id;

CREATE VIEW full_item AS
SELECT i.id,
       i.group_id,
       i.display_name,
       i.icon_url,
       i.created_time,
       i.visible,
       times_purchased(i.id) AS times_purchased,
       item_stock(i.id) AS stock
FROM items i;
