-- Types


-- Tables
CREATE TABLE groups
(
    id       INT                NOT NULL GENERATED ALWAYS AS IDENTITY,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users
(
    id       INT                NOT NULL GENERATED ALWAYS AS IDENTITY,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    group_id INT                NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE TABLE items
(
    id              INT          NOT NULL GENERATED ALWAYS AS IDENTITY,
    group_id        INT          NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    icon_url        VARCHAR(500),
    created_time    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    times_purchased INT          NOT NULL DEFAULT 0,
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
    id           INT         NOT NULL GENERATED ALWAYS AS IDENTITY,
    group_id     INT         NOT NULL,
    created_by   INT         NOT NULL,
    created_for  INT         NOT NULL,
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    quantity            INT           NOT NULL,
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
SELECT t.id, t.group_id, t.group_id, t.created_by, t.created_for, t.created_time,
    i.item_id, i.display_name, i.icon_url, i.purchase_price, i.purchase_price_name, i.quantity
FROM ONLY transactions t LEFT JOIN purchased_items i ON t.id == i.transaction_id;

CREATE VIEW users_total_deposited AS
SELECT u.id, u.gamma_id, u.group_id,
        coalesce((SELECT sum(total)
            FROM deposits d
            WHERE d.created_for = u.id
        ), 0) AS total
FROM users u;

CREATE VIEW users_total_purchased AS
SELECT u.id, u.gamma_id, u.group_id,
        coalesce((
            SELECT sum(p.purchase_price * p.quantity)
            FROM purchases p
            WHERE p.created_for = u.id
        ), 0) AS total
FROM users u;

CREATE VIEW user_balances AS
SELECT u.id, u.gamma_id, u.group_id,
        (SELECT (d.total) FROM users_total_deposited d WHERE d.id == u.id)
      - (SELECT (p.total) FROM users_total_purchased p WHERE p.id == u.id) AS balance
FROM users u;

CREATE VIEW full_user AS
SELECT u.id, u.gamma_id, u.balance, u.group_id,
       g.gamma_id AS group_gamma_id
FROM user_balances u LEFT OUTER JOIN groups g on u.group_id = g.id;
