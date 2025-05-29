import fc, { type Arbitrary } from 'fast-check'
import * as tableType from 'database/types'
import type { GroupId, UserId } from 'gammait'
import { FullStockUpdates } from '../../src/database/types'

export function nullable<T>(arbitrary: Arbitrary<T>): Arbitrary<T | null> {
    return fc.option(arbitrary, { nil: null })
}

// Primitives
export const nat1 = fc.integer({ min: 1 })
export const uuid4 = fc.uuid({ version: 4 })

export const date = fc.date({
    min: new Date('2000-01-01T00:00:00.000Z'), noInvalidDate: true,
})

export const itemName = fc.string({ minLength: 1 })

// Table rows
const userProperties = {
    id: nat1, gamma_id: uuid4 as Arbitrary<UserId>, group_id: nat1,
}
export const user: Arbitrary<tableType.Users> = fc.record(userProperties)

const groupProperties = {
    id: nat1, gamma_id: uuid4 as Arbitrary<GroupId>,
}
export const group: Arbitrary<tableType.Groups> = fc.record(groupProperties)

const itemProperties = {
    id: nat1,
    group_id: nat1,
    display_name: itemName,
    created_time: date,
    visible: fc.boolean(),
    icon_url: nullable(fc.webUrl()),
}
export const item: Arbitrary<tableType.Items> = fc.record(itemProperties)

const priceProperties = {
    item_id: nat1, price: fc.double(), display_name: fc.string(),
}
export const price: Arbitrary<tableType.Prices> = fc.record(priceProperties)

const sharedTransactionProperties = {
    id: nat1, group_id: nat1, created_by: nat1, created_time: date, comment: nullable(fc.string({ minLength: 1 })),
}
const transactionProperties = {
    ...sharedTransactionProperties, type: fc.constantFrom('purchase', 'deposit', 'stock_update'),
}
export const transaction: Arbitrary<tableType.Transactions> = fc.record(transactionProperties)

const purchaseProperties = {
    ...sharedTransactionProperties, created_for: nat1,
}
export const purchase: Arbitrary<tableType.Purchases> = fc.record(purchaseProperties)

const purchasedItemProperties = {
    transaction_id: nat1,

    item_id: nullable(nat1),
    display_name: itemName,
    icon_url: nullable(fc.webUrl()),
    purchase_price: fc.double(),
    purchase_price_name: fc.string(),

    quantity: nat1,
}
export const purchasedItem: Arbitrary<tableType.PurchasedItems> = fc.record(purchasedItemProperties)

const depositProperties = {
    ...sharedTransactionProperties, created_for: nat1, total: fc.double(),
}
export const deposit: Arbitrary<tableType.Deposits> = fc.record(depositProperties)

const stockUpdateProperties = {
    ...sharedTransactionProperties,
}
export const stockUpdate: Arbitrary<tableType.StockUpdates> = fc.record(stockUpdateProperties)

const itemStockUpdateProperties = {
    transaction_id: nat1,

    item_id: nat1, before: fc.integer(), after: fc.integer(),
}
export const itemStockUpdate: Arbitrary<tableType.ItemStockUpdates> = fc.record(itemStockUpdateProperties)

const favoriteItemsProperties = {
    user_id: nat1, item_id: nat1,
}
export const favoriteItem: Arbitrary<tableType.FavoriteItems> = fc.record(favoriteItemsProperties)

const fullPurchaseProperties = {
    ...purchaseProperties,
    item_id: nullable(nat1),
    display_name: itemName,
    icon_url: nullable(fc.webUrl()),
    purchase_price: fc.double(),
    purchase_price_name: fc.string(),
    quantity: nat1,
}
export const fullPurchase: Arbitrary<tableType.FullPurchases> = fc.record(fullPurchaseProperties)

const fullStockUpdateProperties = {
    ...stockUpdateProperties, item_id: nat1, before: fc.integer(), after: fc.integer(),
}
export const fullStockUpdate: Arbitrary<FullStockUpdates> = fc.record(fullStockUpdateProperties)

const fullUserProperties = {
    ...userProperties, balance: fc.double(), group_gamma_id: uuid4 as Arbitrary<GroupId>,
}
export const fullUser: Arbitrary<tableType.FullUser> = fc.record(fullUserProperties)

const fullItemProperties = {
    ...itemProperties, times_purchased: fc.nat(), stock: fc.integer(),
}
export const fullItem: Arbitrary<tableType.FullItem> = fc.record(fullItemProperties)

// Combinations
export const prices: Arbitrary<tableType.Prices[]> = fc.array(price, {
    minLength: 1, maxLength: 100,
})

export const fullItemWithPricesTuple: Arbitrary<[tableType.FullItem, tableType.Prices[], boolean]> = fc.tuple(fullItem, prices, fc.boolean())
export const fullItemWithPrices: Arbitrary<tableType.FullItemWithPrices[]> = fullItemWithPricesTuple
    .map<tableType.FullItemWithPrices[]>(([fi, ps, favorite]) => ps.map<tableType.FullItemWithPrices>(p => ({
        ...fi, favorite, price: p.price, price_display_name: p.display_name,
    })))