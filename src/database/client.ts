import { GroupId, UserId } from 'gammait'
import {Client, ClientConfig, QueryResult, QueryResultRow} from 'pg'
import * as q from './queries'
import * as tableType from './types'
import { Price } from '../types'

class ValidationError extends Error {}

const REQUIRED_TABLES = [
    'deposits',
    'favorite_items',
    'full_user',
    'groups',
    'items',
    'prices',
    'purchased_items',
    'purchases',
    'transactions',
    'user_balances',
    'users',
    'users_total_deposited',
    'users_total_purchased',
]

export const legalItemColumns = ['id', 'groupid', 'displayname', 'iconurl', 'addedtime', 'timespurchased', 'visible'] as const
export type LegalItemColumn = (typeof legalItemColumns)[number]

class DatabaseClient extends Client {
    isReady: boolean = false
    invalid: boolean = false

    /**
     * Validates that the database is properly initialized and ready for use.
     * Rejects if the validation fails.
     */
    validateDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const failValidation = (reason?: string) => {
                reject('Database validation failed' + (reason ? `: ${reason}` : ''))
            }

            try {
                this.fetchRows<tableType.TableNames>(q.GET_TABLES).then(tables => {
                    const existingTables = tables.map(row => row.table_name)
                    const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));

                    if (missingTables.length > 0) {
                        failValidation("Database is missing tables")
                        return
                    }
                    resolve()
                }).catch(reason => {
                    failValidation(reason)
                }
            )
            } catch (error) {
                if (error instanceof Error)
                    failValidation((error as Error).message)
                else
                    failValidation(String(error))
                return
            }
            reject()
        })
    }

    constructor(config?: string | ClientConfig) {
        super(config);

        // Start validation
        this.validateDatabase().then(() => {
            console.log('Database validated successfully')
            this.isReady = true
        }).catch(reason => {
            console.error(reason)
            this.invalid = true
        })
    }

    ready(): Promise<typeof this> {
        return new Promise((resolve, reject) => {
            const check = () => {
                if (this.invalid) {
                    reject("Database validation failed")
                } else if (this.isReady) {
                    resolve(this)
                } else {
                    setTimeout(check, 1000);
                }
            }
            check()
        })
    };

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

    private async fetchExists<T extends tableType.Exists>(query: string, ...values: unknown[]): Promise<boolean> {
        return !!(await this.fetchFirst<T>(query, ...values))!.exists
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
        return await this.fetchExists(q.GROUP_EXISTS, groupId)
    }

    // Users
    async createUser(userId: UserId, groupId: GroupId): Promise<tableType.Users> {
        return (await this.fetchFirst(q.CREATE_USER, userId, groupId))!
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
        return await this.fetchExists(q.USER_EXISTS, userId)
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

    async updateItem(itemId: number, columns: LegalItemColumn[], values: any[]): Promise<tableType.Items | undefined> {
        if (columns.length !== columns.length) {
            throw new Error(`Mismatched array lengths, ${columns.length} columns and ${values.length} values`)
        }

        let row: tableType.Items | undefined = undefined
        for (let i = 0; i < columns.length; i++) {
            if (!legalItemColumns.includes(columns[i])) {
                throw new Error(`Illegal column ${columns[i]}`)
            }
            row = await this.fetchFirst(q.UPDATE_ITEM(columns[i]), itemId, values[i])
        }

        return row
    }

    async itemExists(itemId: number): Promise<boolean> {
        return await this.fetchExists(q.ITEM_EXISTS, itemId)
    }

    async itemExistsInGroup(itemId: number, groupId: GroupId): Promise<boolean> {
        return await this.fetchExists(q.ITEM_EXISTS_IN_GROUP, itemId, groupId)
    }

    async itemNameExistsInGroup(name: string, groupId: GroupId): Promise<boolean> {
        return await this.fetchExists(q.ITEM_NAME_EXISTS_IN_GROUP, name, groupId)
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
    async createTransaction(groupId: GroupId, createdBy: UserId, createdFor: UserId): Promise<tableType.Transactions> {
        return (await this.fetchFirst(q.CREATE_TRANSACTION, groupId, createdBy, createdFor))!
    }

    async getTransaction(transactionId: number): Promise<tableType.Transactions | undefined> {
        return await this.fetchFirst(q.GET_TRANSACTION, transactionId)
    }

    async transactionExistsInGroup(transactionId: number, groupId: GroupId): Promise<boolean> {
        return await this.fetchExists(q.TRANSACTION_EXISTS_IN_GROUP, transactionId, groupId)
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
        return await this.fetchExists(q.HAS_BEEN_PURCHASED, itemId)
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
        return await this.fetchExists(q.FAVORITE_ITEM_EXISTS, userId, itemId)
    }
    // #endregion Queries
}
export default DatabaseClient
