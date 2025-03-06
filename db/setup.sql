CREATE TABLE Groups (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    PRIMARY KEY (GammaId)
);

CREATE TABLE Users (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    Balance FLOAT NOT NULL DEFAULT 0.0,
    PRIMARY KEY (GammaId)
);

CREATE TABLE Items (
    Id SERIAL NOT NULL,
    GroupId VARCHAR(255) NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    IconUrl VARCHAR(255),
    AddedTime TIMESTAMP NOT NULL DEFAULT NOW(),
    TimesPurchased INT NOT NULL DEFAULT 0,
    Visible BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (GroupId, DisplayName),
    PRIMARY KEY (Id),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE Prices (
    ItemId SERIAL NOT NULL,
    Price FLOAT NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    PRIMARY KEY (ItemId, DisplayName),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);

CREATE TABLE Transactions (
    Id SERIAL UNIQUE NOT NULL,
    GroupId VARCHAR(255) NOT NULL,
    CreatedBy VARCHAR(255) NOT NULL,
    CreatedFor VARCHAR(255) NOT NULL,
    CreatedTime TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(GammaId),
    FOREIGN KEY (CreatedFor) REFERENCES Users(GammaId),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE PurchasedItems (
    TransactionId SERIAL NOT NULL,
    Quantity INT NOT NULL,
    PurchasePrice FLOAT NOT NULL,
    PurchasePriceName VARCHAR(32) NOT NULL,
    ItemId SERIAL NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    IconUrl VARCHAR(255),
    FOREIGN KEY (TransactionId) REFERENCES Transactions(Id),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);

CREATE TABLE Deposits (
    TransactionId SERIAL NOT NULL,
    Total FLOAT NOT NULL,
    FOREIGN KEY (TransactionId) REFERENCES Transactions(Id)
);

CREATE TABLE FavoriteItems (
    UserId VARCHAR(255) UNIQUE NOT NULL,
    ItemId SERIAL NOT NULL,
    UNIQUE (UserId, ItemId),
    FOREIGN KEY (UserId) REFERENCES Users(GammaId),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);