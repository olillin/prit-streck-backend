import { GroupId, UserId } from 'gammait'
import { Client, QueryResult, QueryResultRow } from 'pg'
import * as q from './queries'
import * as tableType from './types'
import { Price } from '../types'

class ValidationError extends Error {}

class DatabaseClient extends Client {
    validateDatabase() {
        // TODO: Validate that all tables exist and are properly configured.
    }

    // #region Utility
    private async fetch<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<QueryResult<T>> {
        return new Promise(resolve => {
            this.query(query, values).then(response => {
                resolve(response)
            })
        })
    }

    private async fetchRows<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<T[]> {
        return (await this.fetch<T>(query, ...values)).rows
    }

    private async fetchFirst<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<T | undefined> {
        return (await this.fetchRows<T>(query, ...values))[0]
    }
    // #endregion Utility

    // #region Queries

    //  Groups
    async createGroup(groupId: GroupId) {
        return await this.fetchFirst(q.CREATE_GROUP, groupId)
    }

    async getGroup(groupId: GroupId): Promise<tableType.Groups | undefined> {
        return await this.fetchFirst(q.GET_GROUP, groupId)
    }

    async getGroups(): Promise<tableType.Groups[]> {
        return await this.fetchRows(q.GET_GROUPS)
    }

    async groupExists(groupId: GroupId): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.GROUP_EXISTS, groupId))!.exists
    }

    // Users
    async createUser(userId: UserId): Promise<tableType.Users> {
        return (await this.fetchFirst(q.CREATE_USER, userId))!
    }

    async getUser(userId: UserId): Promise<tableType.Users | undefined> {
        return await this.fetchFirst(q.GET_USER, userId)
    }

    async getUsersInGroup(groupId: GroupId): Promise<tableType.Users[]> {
        return await this.fetchRows(q.GET_USERS_IN_GROUP, groupId)
    }

    async setBalance(userId: UserId, balance: number) {
        return await this.fetchFirst(q.SET_BALANCE, userId, balance)
    }

    async userExists(userId: UserId): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.USER_EXISTS, userId))!.exists
    }

    // Items
    async createItem(groupId: GroupId, displayName: string, iconUrl?: string): Promise<tableType.Items> {
        if (iconUrl) {
            return (await this.fetchFirst(q.CREATE_ITEM_WITH_ICON, groupId, displayName, iconUrl))!
        } else {
            return (await this.fetchFirst(q.CREATE_ITEM, groupId, displayName))!
        }
    }

    async getItem(itemId: number): Promise<tableType.Items | undefined> {
        return await this.fetchFirst(q.GET_ITEM, itemId)
    }

    async getItemsInGroup(groupId: GroupId): Promise<tableType.Items[]> {
        return await this.fetchRows(q.GET_ITEMS_IN_GROUP, groupId)
    }

    async updateItem(itemId: number, columns: string[], values: any[]): Promise<tableType.Items | undefined> {
        if (columns.length !== columns.length) {
            throw new Error(`Mismatched array lengths, ${columns.length} columns and ${values.length} values`)
        }

        let row: tableType.Items | undefined = undefined
        for (let i = 0; i < columns.length; i++) {
            row = await this.fetchFirst(q.UPDATE_ITEM, itemId, columns[i], values[i])
        }

        return row
    }

    async itemExists(itemId: number): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.ITEM_EXISTS, itemId))!.exists
    }

    async itemExistsInGroup(itemId: number, groupId: GroupId): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.ITEM_EXISTS_IN_GROUP, itemId, groupId))!.exists
    }

    async itemNameExistsInGroup(name: string, groupId: GroupId): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.ITEM_NAME_EXISTS_IN_GROUP, name, groupId))!.exists
    }

    async isItemVisible(itemId: number): Promise<boolean> {
        return (await this.getItem(itemId))?.visible === true
    }

    async deleteItem(itemId: number): Promise<void> {
        await this.fetch(q.DELETE_ITEM, itemId)
    }

    // Prices
    async addPrice(itemId: number, price: number, displayName: string): Promise<tableType.Prices> {
        return (await this.fetchFirst(q.CREATE_PRICE, itemId, price, displayName))!
    }

    async getPricesForItem(itemId: number): Promise<tableType.Prices[]> {
        return await this.fetchRows(q.GET_PRICES_FOR_ITEM, itemId)
    }

    async removePricesForItem(itemId: number): Promise<void> {
        await this.fetch(q.REMOVE_PRICES_FOR_ITEM, itemId)
    }

    // Transactions
    async createTransaction(groupId: GroupId, purchasedBy: UserId, purchasedFor: UserId): Promise<tableType.Transactions> {
        return (await this.fetchFirst(q.CREATE_TRANSACTION, groupId, purchasedBy, purchasedFor))!
    }

    async getTransaction(transactionId: number): Promise<tableType.Transactions | undefined> {
        return await this.fetchFirst(q.GET_TRANSACTION, transactionId)
    }

    async countTransactionsInGroup(groupId: GroupId): Promise<number> {
        return parseInt((await this.fetchFirst<tableType.Count>(q.COUNT_TRANSACTIONS_IN_GROUP, groupId))!.count)
    }

    async getTransactionsInGroup(groupId: GroupId): Promise<tableType.Transactions[]> {
        return await this.fetchRows(q.GET_TRANSACTIONS_IN_GROUP, groupId)
    }

    async deleteTransaction(transactionId: number): Promise<void> {
        await this.fetch(q.DELETE_TRANSACTION, transactionId)
    }

    // Deposit
    async createDeposit(transactionId: number, total: number): Promise<tableType.Deposits> {
        return (await this.fetchFirst(q.CREATE_DEPOSIT, transactionId, total))!
    }

    async getDeposit(transactionId: number): Promise<tableType.Deposits | undefined> {
        return await this.fetchFirst(q.GET_DEPOSIT, transactionId)
    }

    async deleteDeposit(transactionId: number): Promise<void> {
        await this.fetch(q.DELETE_DEPOSIT, transactionId)
    }

    // Purchased items
    async addPurchasedItem(purchaseId: number, quantity: number, purchasePrice: Price, itemId: number, displayName: string, iconUrl?: string): Promise<tableType.PurchasedItems> {
        if (iconUrl) {
            return (await this.fetchFirst(
                q.ADD_PURCHASED_ITEM_WITH_ICON, //
                purchaseId,
                quantity,
                purchasePrice.price,
                purchasePrice.displayName,
                itemId,
                displayName,
                iconUrl
            ))!
        } else {
            return (await this.fetchFirst(
                q.ADD_PURCHASED_ITEM, //
                purchaseId,
                quantity,
                purchasePrice.price,
                purchasePrice.displayName,
                itemId,
                displayName
            ))!
        }
    }

    async getPurchasedItems(purchaseId: number): Promise<tableType.PurchasedItems[]> {
        return await this.fetchRows(q.GET_PURCHASED_ITEMS, purchaseId)
    }

    async hasBeenPurchased(itemId: number): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.HAS_BEEN_PURCHASED, itemId))!.exists
    }

    // Favorites
    async addFavorite(userId: UserId, itemId: number): Promise<tableType.FavoriteItems> {
        const favorite = await this.fetchFirst<tableType.FavoriteItems>(q.GET_FAVORITE_ITEM, userId, itemId)
        if (favorite) return favorite
        return (await this.fetchFirst(q.ADD_FAVORITE_ITEM, userId, itemId))!
    }

    async removeFavorite(userId: UserId, itemId: number): Promise<void> {
        await this.fetch(q.REMOVE_FAVORITE_ITEM, userId, itemId)
    }

    async isFavorite(userId: UserId, itemId: number): Promise<boolean> {
        return !!(await this.fetchFirst<tableType.Exists>(q.FAVORITE_ITEM_EXISTS, userId, itemId))!.exists
    }
    // #endregion Queries
}
export default DatabaseClient
