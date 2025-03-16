-- Types


-- Tables
CREATE TABLE groups (
    id SERIAL NOT NULL,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users (
    id SERIAL NOT NULL,
    gamma_id VARCHAR(64) UNIQUE NOT NULL,
    group_id INT NOT NULL,
    balance NUMERIC(7,2) NOT NULL DEFAULT 0.0,
    PRIMARY KEY (id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE items (
    id SERIAL NOT NULL,
    group_id INT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    times_purchased INT NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT 't',
    UNIQUE (group_id, display_name),
    PRIMARY KEY (id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE prices (
    item_id INT NOT NULL,
    price NUMERIC(7,2) NOT NULL,
    display_name VARCHAR(30) NOT NULL,
    PRIMARY KEY (item_id, display_name),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id SERIAL NOT NULL,
    group_id INT NOT NULL,
    created_by INT NOT NULL,
    created_for INT NOT NULL,
    created_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (created_for) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE purchased_items (
    transaction_id INT NOT NULL,
    item_id INT,
    display_name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(500),
    purchase_price NUMERIC(7,2) NOT NULL,
    purchase_price_name VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

CREATE TABLE deposits (
    transaction_id INT NOT NULL,
    total NUMERIC(7,2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE TABLE favorite_items (
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    UNIQUE (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);