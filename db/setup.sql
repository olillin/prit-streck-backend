USE PritStreck;

CREATE TABLE Groups (
    Id INT UNIQUE NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    IconUrl VARCHAR(255) NOT NULL,
    PRIMARY KEY (Id)
);

CREATE TABLE Users (
    GammaId VARCHAR(255) UNIQUE NOT NULL,
    PRIMARY KEY (GammaId)
);

CREATE TABLE UserGroups (
    UserId VARCHAR(255) UNIQUE NOT NULL,
    GroupId INT NOT NULL,
    Administrator BOOLEAN NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(GammaId),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id)
);

CREATE TABLE Items (
    Id INT UNIQUE NOT NULL,
    DisplayName VARCHAR(32) NOT NULL,
    IconUrl VARCHAR(255) NOT NULL,
    TimesPurchased INT NOT NULL,
    PRIMARY KEY (Id)
)

CREATE TABLE Purchases (
    Id INT UNIQUE NOT NULL,
    PurchasedBy VARCHAR(255) UNIQUE NOT NULL,
    PurchasedFor VARCHAR(255) UNIQUE NOT NULL,
    GroupId INT NOT NULL,
    PurchasedDate DATETIME NOT NULL,
    PRIMARY KEY (Id),
    FOREIGN KEY (PurchasedBy) REFERENCES Users(GammaId),
    FOREIGN KEY (PurchasedFor) REFERENCES Users(GammaId),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id)
);

CREATE TABLE PurchasedItems (
    I
)