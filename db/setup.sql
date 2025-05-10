-- Tables
CREATE TABLE groups
(
    id       SERIAL                NOT NULL,
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
    id              SERIAL       NOT NULL,
    group_id        INT          NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    icon_url        VARCHAR(500),
    created_time    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    visible         BOOLEAN      NOT NULL DEFAULT 't',
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

CREATE TABLE transactions
(
    id           SERIAL      NOT NULL,
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
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE SET NULL
);

CREATE TABLE deposits
(
    total NUMERIC(7, 2) NOT NULL
) INHERITS (transactions);

CREATE TABLE favorite_items
(
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    UNIQUE (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Views
CREATE VIEW purchases AS
SELECT t.id, t.group_id, t.created_by, t.created_for, t.created_time, t.comment,
    i.item_id, i.display_name, i.icon_url, i.purchase_price, i.purchase_price_name, i.quantity
FROM ONLY transactions t LEFT JOIN purchased_items i ON t.id = i.transaction_id;

CREATE VIEW users_total_deposited AS
SELECT u.id, u.gamma_id, u.group_id,
        coalesce((SELECT sum(total)
            FROM deposits d
            WHERE d.created_for = u.id
        ), 0)::NUMERIC(7, 2) AS total
FROM users u;

CREATE VIEW users_total_purchased AS
SELECT u.id, u.gamma_id, u.group_id,
        coalesce((
            SELECT sum(p.purchase_price * p.quantity)
            FROM purchases p
            WHERE p.created_for = u.id
        ), 0)::NUMERIC(7, 2) AS total
FROM users u;

CREATE VIEW user_balances AS
SELECT u.id, u.gamma_id, u.group_id,
        (SELECT (d.total) FROM users_total_deposited d WHERE d.id = u.id)
      - (SELECT (p.total) FROM users_total_purchased p WHERE p.id = u.id) AS balance
FROM users u;

CREATE VIEW full_user AS
SELECT u.id, u.gamma_id, u.balance, u.group_id,
       g.gamma_id AS group_gamma_id
FROM user_balances u LEFT OUTER JOIN groups g on u.group_id = g.id;

CREATE VIEW full_item AS
SELECT i.id, i.group_id, i.display_name, i.icon_url, i.created_time, i.visible,
        coalesce((SELECT sum(p.quantity)
                  FROM purchased_items p
                  WHERE p.item_id = i.id
                  ), 0)::INT AS times_purchased
FROM items i;

CREATE VIEW full_transactions AS
SELECT
       id,
       group_id,
       created_by,
       created_for,
       created_time,
       comment,
       total,
       NULL AS item_id,
       NULL AS display_name,
       NULL AS icon_url,
       NULL AS purchase_price,
       NULL AS purchase_price_name,
       NULL AS quantity
FROM deposits
UNION ALL
SELECT
    id,
    group_id,
    created_by,
    created_for,
    created_time,
    comment,
    NULL AS total,
    item_id,
    display_name,
    icon_url,
    purchase_price,
    purchase_price_name,
    quantity
FROM purchases ORDER BY created_time DESC