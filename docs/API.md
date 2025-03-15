# P.R.I.T. Strecklista backend API documentation

## Index

## General

### API Responses

All API responses are in JSON format. If the request was successful the response will look like this and contain a data object:

```javascript
{
  "data": <response data here>
}
```

However if an error occurs the request will not contain a data object and instead contain an error:

```javascript
{
  "error": {
    "code": <HTTP error code as int>
    "message": "<error message>"
  }
}
```

### General Errors

| Code | Message |
| :---- | :---- |
| 400 | Missing required property '\<name\>' in \<location\> |
| 400 | Property '\<name\>' is invalid in \<location\> |
| 400 | Invalid user ID |
| 401 | Unauthorized |
| 403 | User does not have permission to access this service |
| 500 | An unexpected error occurred. Please create an issue on GitHub |
| 502 | Received invalid response from gamma |
| 504 | Unable to reach gamma |

## Types

### UserId

UUID of a user in gamma.

### GroupId

UUID of a group in gamma.

### User

```javascript
{
  "id": UserId
  "firstName": string
  "lastName": string
  "nick": string
  "avatarUrl": string

  "balance": decimal
}
```

### Group

```javascript
{
  "id": GroupId,
  "prettyName": string,
  "avatarUrl": string
}
```

### Item

```javascript
{
  "id": int, // Numeric auto-incrementing item id
  "addedTime": int, // Timestamp where this item was created in ms
  "icon": string?, // URL to the item icon
  "displayName": string,
  "prices": Price[],
  "timesPurchased": int,
  "visible": boolean, // If this item is visible
  "favorite": boolean // If the logged in user has favorited this item
}
```

### Price

```javascript
{
  "price": decimal, // Price in SEK
  "displayName": string
}
```

### Transaction

```javascript
{
  "type": "purchase" | "deposit",
  "id": int, // Numeric auto-incrementing id
  "createdBy": UserId, // Who created the transaction
  "createdFor": UserId, // Who does the transaction affect
  "createdTime": int // Timestamp when this transaction was created in ms
}
```

### Purchase

extends [Transaction](#transaction)

```javascript
{
  "type": "purchase",
  "items": PurchasedItem[]
}
```

### PurchasedItem

```javascript
{
  "item": {
    "id": int?,
    "displayName": string,
    "icon": string?
  },
  "quantity": int,
  "purchasePrice": Price
}
```

### Deposit

extends [Transaction](https://docs.google.com/document/d/1KiCo3THSqslC1P8mMXRVONOrT_bQvYtZV1Pq-U-a90g/edit?pli=1&tab=t.0#heading=h.q6qxtz6h8p1q)

```javascript
{
  "type": "deposit",
  "total": decimal // Deposit amount in SEK
}
```

##

## Authorization

### Authorization flow

1. User goes to [https://prit.chalmers.it/store/authorize](https://prit.chalmers.it/store/authorize).

2. User is redirected to the Gamma login screen.

3. After logging in the user will be sent to the callback with a Gamma authorization code:  
   `https://prit.chalmers.it/store/callback?code=<gamma code>`

4. The client page sends the `code` from Gamma in a `POST` request to:  
   `https://prit.chalmers.it/store/backend/login`

5. The server validates the code and user and then responds with a JWT token.

6. The client saves the token (in cookies/session storage) for later use.

7. In future requests the token is sent in the `Authorization` header as a bearer token:  
   `Authorization: Bearer <JWT token>`

### GET /authorize

Redirect to Gamma login page. After logging in the user will be redirected to:

`https://prit.chalmers.it/store/callback`

### POST /login

Login using an authorization code from Gamma.

#### Request

Provide the **code** in the query like this:

`/login?code=<AUTHORIZATION CODE FROM GAMMA REDIRECT>`

#### Response

The generated JWT token and data about the authenticated user and their group.

```javascript
{
  "access_token": <JWT token string>,
  "token_type": "Bearer",
  "expires_in": number, // How many seconds the token is valid for
  "user": User,
  "group": Group
}
```

#### Errors

| Code | Message |
| :---- | :---- |
| 404 | Unable to find user in gamma |
| 502 | Failed to get gamma token: \<error\> |

## API Endpoints

All of the following endpoints are under <https://prit.chalmers.it/store/api>

### GET /user

Get info about the currently authenticated user.

#### Response

Data about the user and their group.

##### Example

```javascript
{
  "data": {
    "user": {
      "balance": 0,
      "id": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
      "nick": "Cal",
      "firstName": "Oliver",
      "lastName": "Lindell",
      "avatarUrl": "https://auth.chalmers.it/images/...
    },
    "group": {
      "id": "3cf94646-2412-4896-bba9-5d2410ac0c62",
      "avatarUrl": "https://auth.chalmers.it/images/...,
      "prettyName": "P.R.I.T. 25"
    }
  }
}
```

###

### GET /group

Get info about the group of the currently authenticated user.

#### Response

The group and it's members:

```javascript
{
  "data": {
    "group": Group,
    "members": User[]
  }
}
```

##### Example

```javascript
{
  "data": {
    "group": {
      "id": "3cf94646-2412-4896-bba9-5d2410ac0c62",
      "avatarUrl": "https://auth.chalmers.it/images/group/avatar/3cf94646-2412-4896-bba9-5d2410ac0c62",
      "prettyName": "P.R.I.T. 25"
    },
    "members": [
      {
        "balance": 0,
        "id": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "nick": "Cal",
        "firstName": "Oliver",
        "lastName": "Lindell",
        "avatarUrl": "https://auth.chalmers.it/images/user/avatar/7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b"
      },
      {
        "balance": 0,
        "id": "b69e01cd-01d1-465e-adc5-99d017b7fd74",
        "nick": "Göken",
        "firstName": "Erik",
        "lastName": "Persson",
        "avatarUrl": "https://auth.chalmers.it/images/user/avatar/b69e01cd-01d1-465e-adc5-99d017b7fd74"
      }
    ]
  }
}
```

### GET /group/transaction

List transactions in currently authenticated user's group.

#### Parameters

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| limit | N | number (default: 50\) | How many purchases to list at most |
| offset | N | number (default: 0\) | How many purchases to skip over in the start |

#### Response

A paginated list of transactions with the newest first.  
Unless offset is 0 a *previous* url is provided to get the previous page of the list with the same limit or lower.  
Unless at the end of the list a *next* url is provided to get the next page of the list with the same limit.

```javascript
{
  "data": {
    "transactions": Transaction[],
    "next": string?, // URL to request for next page
    "previous": string? // URL to request for next page
  }
}
```

##### Example

```javascript
{
  "data": {
    "transactions": [
      {
        "type": "purchase",
        "purchaseTime": 1738594127,
        "purchasedBy": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "purchasedFor": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "items": [
          {
            "id": 954210554821,
            "count": 1
          }
        ]
      },
      {
        "type": "purchase",
        "purchaseTime": 1738594001,
        "purchasedBy": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "purchasedFor": "b69e01cd-01d1-465e-adc5-99d017b7fd74",
        "items": [
          {
            "id": 954210554821,
            "count": 3
          },
          {
            "id": 754210554621,
            "count": 1
          }
        ]
      },
      {
        "type": "deposit",
        "depositTime": 1738583085,
        "depositBy": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "depositFor": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
        "total": 488.90
      }
    ],
    "next": "https://prit.chalmers.it/store/api/group/purchases?limit=2&offset=6",
    "previous": "https://prit.chalmers.it/store/api/group/purchases?limit=2&offset=2"
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | Limit must be an integer between 1 and 100 |
| 400 | Offset must be a positive integer |

### GET /group/transaction/\<id\>

Get a specific transaction.

#### Response

```javascript
{
  "data": {
    "transaction": Purchase | Deposit
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | Invalid transaction ID |
| 404 | Transaction does not exist |

### POST /group/purchase

Add a new purchase to a user. The user making the purchase is saved from auth.

#### Body

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| userId | Y | Gamma user id | The user to add the purchase to |
| items | Y | {   “id”: int,   “quantity”: int   “purchasePrice”: Price }\[\] | The items to purchase |

#### Response

The newly created transaction:

```javascript
{
  "data": {
    "transaction": Purchase
    "balance": decimal // User's balance after transaction
  }
}
```

##### Example

```javascript
{
  "data": {
    "transaction": {
      "type": "purchase",
      "purchaseTime": 1738594127,
      "purchasedBy": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
      "purchasedFor": "7ba99a26-9ad3-4ad8-ab7f-5891c2d82a4b",
      "items": [
        {
          "id": 954210554821,
          "count": 1
        }
      ]
    },
    "balance": -19
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | Item count must be greater than 0 |
| 400 | Must purchase at least one item |
| 403 | Cannot purchase a non-visible item |
| 404 | User does not exist |
| 404 | Item does not exist |

### POST /group/deposit

#### Body

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| userId | Y | Gamma user id | The user to add the deposit to |
| total | Y | decimal | How much to add to the user's balance in SEK |

#### Response

The newly created transaction:

```javascript
{
  "data": {
    "transaction": Deposit
    "balance": decimal // User's balance after transaction
  }
}
```

##### Example

```javascript
{
  "data": {
    "transaction": {
      "type": "deposit",
      "id": 7,
      "total": 532.0
    },
    "balance": -23.5
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 404 | User does not exist |

### GET /group/item

List available items for the group

#### Parameters

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| sort | N | *One of these strings:* popular (default) cheap expensive new old name\_a2z name\_z2a | How to sort products |
| visibleOnly | N | bool (default: true) | Whether or not to exclude invisible products |

#### Response

A list of items sorted depending on the sort parameter.

##### Example

```javascript
{
  "data": {
    "items": [
      {
        "id": 954210554821,
        "addedTime": 1738564532,
        "displayName": "Läsk",
        "prices": [
          {
            "displayName": "Extern",
            "price": 12.0,
          }
        ],
        "timesPurchased": 3,
        "visible": true,
        "favorite": true
      },
      {
        "id": 754210554621,
        "addedTime": 1738584035,
        "icon": "https://example.com/product-images/cider.png",
        "displayName": "Cider",
        "prices": [
          {
            "displayName": "Patet",
            "price": 15.0,
          }
        ],
        "timesPurchased": 2,
        "visible": false,
        "favorite": false
      }
    ]
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | Unknown sort order |

### POST /group/item

Create a new item

#### Body

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| displayName | Y | string | The item name to display |
| prices | Y | [Price](#price)\[\] | Prices for the item in SEK |
| icon | N | string | The URL of the item icon |

#### Response

Responds with the created item (same response as [GET /group/item/\<id\>](#get-/group/item/id))

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | An item must have at least one price |
| 403 | Display name is not unique |

### GET /group/item/\<id\>

Get info about an item.

#### Response

```javascript
{
  "data": {
    "item": Item
  }
}
```

##### Example

```javascript
{
  "data": {
    "item": {
      "id": 954210554821,
      "addedTime": 1738564532,
      "icon": "https://example.com/product-images/fanta-exotic.png",
      "displayName": "Läsk",
      "prices": [
        {
          "displayName": "Internt",
          "price": 7.0,
        }
      ],
      "timesPurchased": 3,
      "visible": true,
      "favorite": false
    }
  }
}
```

#### Errors

| Code | Error |
| :---- | :---- |
| 400 | Invalid item ID |
| 404 | Item does not exist |

### PATCH /group/item/\<id\>

Update an existing item.

#### Body

| Name | Required | Type | Description |
| :---- | :---- | :---- | :---- |
| icon | N | string | The URL of the item icon |
| displayName | N | string | The name to display next to the item |
| prices | N | [Price](#price)\[\] | Prices for the item in SEK |
| visible | N | bool | Whether or not to show this item |
| favorite | N | bool | Whether or not this is a favorite item |

#### Response

The item after the update (same as [GET /group/item/\<id\>](https://docs.google.com/document/d/1KiCo3THSqslC1P8mMXRVONOrT_bQvYtZV1Pq-U-a90g/edit?pli=1&tab=t.0#heading=h.xg7vdnf0jesz))

#### Errors

| Code | Error |
| :---- | :---- |
| 403 | Display name is not unique |
| 404 | Item does not exist |

### DELETE /group/item/\<id\>

Delete an item

#### Errors

| Code | Error |
| :---- | :---- |
| 404 | Item does not exist |
