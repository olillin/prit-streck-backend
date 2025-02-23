CREATE TABLE Groups (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    PRIMARY KEY (GammaId)
);

CREATE TABLE Users (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    Balance FLOAT NOT NULL DEFAULT 0.0,
    PRIMARY KEY (GammaId),
);

CREATE TABLE Items (
    Id SERIAL NOT NULL,
    GroupId VARCHAR(255) NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    IconUrl VARCHAR(255),
    AddedTime TIMESTAMP NOT NULL DEFAULT NOW(),
    TimesPurchased INT NOT NULL DEFAULT 0,
    Visible BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (Id),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE Prices (
    ItemId SERIAL NOT NULL,
    Price FLOAT NOT NULL,
    DisplayName VARCHAR(32),
    UNIQUE (ItemId, DisplayName),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);

CREATE TABLE Purchases (
    Id SERIAL UNIQUE NOT NULL,
    GroupId VARCHAR(255) NOT NULL,
    PurchasedBy VARCHAR(255) UNIQUE NOT NULL,
    PurchasedFor VARCHAR(255) UNIQUE NOT NULL,
    PurchasedDate TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (Id),
    FOREIGN KEY (PurchasedBy) REFERENCES Users(GammaId),
    FOREIGN KEY (PurchasedFor) REFERENCES Users(GammaId),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE PurchasedItems (
    PurchaseId SERIAL NOT NULL,
    ItemId SERIAL NOT NULL,
    Quantity INT NOT NULL,
    PurchasePrice FLOAT NOT NULL,
    FOREIGN KEY (PurchaseId) REFERENCES Purchases(Id),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);
