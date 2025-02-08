USE PritStreck;

CREATE TABLE Groups (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    PRIMARY KEY (GammaId)
);

CREATE TABLE Users (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    Balance INT NOT NULL,
    PRIMARY KEY (GammaId)
);

CREATE TABLE Items (
    Id INT UNIQUE NOT NULL,
    GroupId VARCHAR(255) NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    Price INT NOT NULL,
    IconUrl VARCHAR(255),
    TimesPurchased INT NOT NULL,
    Visible BOOLEAN NOT NULL,
    PRIMARY KEY (Id),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE Purchases (
    Id INT UNIQUE NOT NULL,
    GroupId INT NOT NULL,
    PurchasedBy VARCHAR(255) UNIQUE NOT NULL,
    PurchasedFor VARCHAR(255) UNIQUE NOT NULL,
    PurchasedDate DATETIME NOT NULL,
    PRIMARY KEY (Id),
    FOREIGN KEY (PurchasedBy) REFERENCES Users(GammaId),
    FOREIGN KEY (PurchasedFor) REFERENCES Users(GammaId),
    FOREIGN KEY (GroupId) REFERENCES Groups(GammaId)
);

CREATE TABLE PurchasedItems (
    PurchaseId INT NOT NULL,
    ItemId INT NOT NULL,
    Quantity INT NOT NULL,
    CurrentPrice INT NOT NULL,
    FOREIGN KEY (PurchaseId) REFERENCES Purchases(Id),
    FOREIGN KEY (ItemId) REFERENCES Items(Id)
);
