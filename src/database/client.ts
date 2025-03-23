import {GroupId, UserId} from 'gammait'
import {Client, ClientConfig, QueryResult, QueryResultRow} from 'pg'
import * as q from './queries'
import * as tableType from './types'
import {Price} from '../types'

const REQUIRED_TABLES = ['deposits', 'favorite_items', 'full_user', 'groups', 'items', 'prices', 'purchased_items', 'purchases', 'transactions', 'user_balances', 'users', 'users_total_deposited', 'users_total_purchased',]

export const legalItemColumns = ['id', 'groupid', 'displayname', 'iconurl', 'addedtime', 'timespurchased', 'visible'] as const
export type LegalItemColumn = (typeof legalItemColumns)[number]

export class DatabaseError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

class DatabaseClient extends Client {
    isReady: boolean = false
    invalid: boolean = false

    constructor(config?: string | ClientConfig) {
        super(config);

        // Connect to database
        this.connect()
            // Start validation
            .then(() => this.validateDatabase())
            .then(() => {
                console.log('Database validated successfully')
                return this.query("SET client_encoding = 'UTF8';")
            }).then(() => this.isReady = true)
            .catch(reason => {
                console.error('Creating database client failed: ' + reason)
                this.invalid = true
            })

    }

    /**
     * Validates that the database is properly initialized and ready for use.
     * Rejects if the validation fails.
     */
    validateDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Get database tables
            this.queryRows<tableType.TableNames>(q.GET_TABLES)
                .then(tables => {
                    // Check if all required tables exist
                    const existingTables = tables.map(row => row.table_name)
                    const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));
                    if (missingTables.length > 0) {
                        throw "Database is missing tables"
                    }

                    // All checks pass
                    resolve()
                })
                .catch(reason => {
                    // Validation failed
                    reject('Database validation failed' + (reason ? `: ${reason}` : ''))
                })
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

    //  Groups
    async createGroup(gammaGroupId: GroupId): Promise<tableType.Groups> {
        return (await this.queryFirstRow(q.CREATE_GROUP, gammaGroupId))!
    }
    
    async softCreateGroupAndUser(gammaGroupId: GroupId, gammaUserId: UserId): Promise<tableType.FullUser> {
        return (await this.queryWithTransaction<tableType.FullUser>(
            q.SOFT_CREATE_GROUP_AND_USER, gammaGroupId, gammaUserId
        ))!.rows[0]
    }

    async getGroup(groupId: number): Promise<tableType.Groups | undefined> {
        return await this.queryFirstRow(q.GET_GROUP, groupId)
    }

    async getGroups(): Promise<tableType.Groups[]> {
        return await this.queryRows(q.GET_GROUPS)
    }

    async groupExists(groupId: number): Promise<boolean> {
        return await this.queryExists(q.GROUP_EXISTS, groupId)
    }

    async gammaGroupExists(gammaGroupId: GroupId): Promise<boolean> {
        return await this.queryExists(q.GAMMA_GROUP_EXISTS, gammaGroupId)
    }

    // #endregion Utility

    // #region Queries

    // Users
    async createUser(userId: UserId, groupId: GroupId): Promise<tableType.Users> {
        return (await this.queryFirstRow(q.CREATE_USER, userId, groupId))!
    }

    async getUser(userId: number): Promise<tableType.Users | undefined> {
        return await this.queryFirstRow(q.GET_USER, userId)
    }

    async getUsersInGroup(groupId: number): Promise<tableType.Users[]> {
        return await this.queryRows(q.GET_USERS_IN_GROUP, groupId)
    }

    async setBalance(userId: number, balance: number) {
        return await this.queryFirstRow(q.SET_BALANCE, userId, balance)
    }

    async userExists(userId: number): Promise<boolean> {
        return await this.queryExists(q.USER_EXISTS, userId)
    }

    // Items
    async createItem(groupId: number, displayName: string, iconUrl?: string): Promise<tableType.Items> {
        if (iconUrl) {
            return (await this.queryFirstRow(q.CREATE_ITEM_WITH_ICON, groupId, displayName, iconUrl))!
        } else {
            return (await this.queryFirstRow(q.CREATE_ITEM, groupId, displayName))!
        }
    }

    async getItem(itemId: number): Promise<tableType.Items | undefined> {
        return await this.queryFirstRow(q.GET_ITEM, itemId)
    }

    async getItemsInGroup(groupId: number): Promise<tableType.Items[]> {
        return await this.queryRows(q.GET_ITEMS_IN_GROUP, groupId)
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
            row = await this.queryFirstRow(q.UPDATE_ITEM(columns[i]), itemId, values[i])
        }

        return row
    }

    async itemExists(itemId: number): Promise<boolean> {
        return await this.queryExists(q.ITEM_EXISTS, itemId)
    }

    async itemExistsInGroup(itemId: number, groupId: number): Promise<boolean> {
        return await this.queryExists(q.ITEM_EXISTS_IN_GROUP, itemId, groupId)
    }

    async itemNameExistsInGroup(name: string, groupId: number): Promise<boolean> {
        return await this.queryExists(q.ITEM_NAME_EXISTS_IN_GROUP, name, groupId)
    }

    async isItemVisible(itemId: number): Promise<boolean> {
        return (await this.getItem(itemId))?.visible === true
    }

    async deleteItem(itemId: number): Promise<void> {
        await this.queryWith(q.DELETE_ITEM, itemId)
    }

    // Prices
    async addPrice(itemId: number, price: number, displayName: string): Promise<tableType.Prices> {
        return (await this.queryFirstRow(q.CREATE_PRICE, itemId, price, displayName))!
    }

    async getPricesForItem(itemId: number): Promise<tableType.Prices[]> {
        return await this.queryRows(q.GET_PRICES_FOR_ITEM, itemId)
    }

    async removePricesForItem(itemId: number): Promise<void> {
        await this.queryWith(q.REMOVE_PRICES_FOR_ITEM, itemId)
    }

    // Transactions
    async createTransaction(groupId: number, createdBy: number, createdFor: number): Promise<tableType.Transactions> {
        return (await this.queryFirstRow(q.CREATE_TRANSACTION, groupId, createdBy, createdFor))!
    }

    async getTransaction(transactionId: number): Promise<tableType.Transactions | undefined> {
        return await this.queryFirstRow(q.GET_TRANSACTION, transactionId)
    }

    async transactionExistsInGroup(transactionId: number, groupId: number): Promise<boolean> {
        return await this.queryExists(q.TRANSACTION_EXISTS_IN_GROUP, transactionId, groupId)
    }

    async countTransactionsInGroup(groupId: number): Promise<number> {
        return parseInt((await this.queryFirstRow<tableType.Count>(q.COUNT_TRANSACTIONS_IN_GROUP, groupId))!.count)
    }

    async getTransactionsInGroup(groupId: number): Promise<tableType.Transactions[]> {
        return await this.queryRows(q.GET_TRANSACTIONS_IN_GROUP, groupId)
    }

    async deleteTransaction(transactionId: number): Promise<void> {
        await this.queryWith(q.DELETE_TRANSACTION, transactionId)
    }

    // Deposit
    async createDeposit(transactionId: number, total: number): Promise<tableType.Deposits> {
        return (await this.queryFirstRow(q.CREATE_DEPOSIT, transactionId, total))!
    }

    async getDeposit(transactionId: number): Promise<tableType.Deposits | undefined> {
        return await this.queryFirstRow(q.GET_DEPOSIT, transactionId)
    }

    async deleteDeposit(transactionId: number): Promise<void> {
        await this.queryWith(q.DELETE_DEPOSIT, transactionId)
    }

    // Purchased items
    async addPurchasedItem(purchaseId: number, quantity: number, purchasePrice: Price, itemId: number, displayName: string, iconUrl?: string): Promise<tableType.PurchasedItems> {
        if (iconUrl) {
            return (await this.queryFirstRow(q.ADD_PURCHASED_ITEM_WITH_ICON, //
                purchaseId, quantity, purchasePrice.price, purchasePrice.displayName, itemId, displayName, iconUrl))!
        } else {
            return (await this.queryFirstRow(q.ADD_PURCHASED_ITEM, //
                purchaseId, quantity, purchasePrice.price, purchasePrice.displayName, itemId, displayName))!
        }
    }

    async getPurchasedItems(purchaseId: number): Promise<tableType.PurchasedItems[]> {
        return await this.queryRows(q.GET_PURCHASED_ITEMS, purchaseId)
    }

    async hasBeenPurchased(itemId: number): Promise<boolean> {
        return await this.queryExists(q.HAS_BEEN_PURCHASED, itemId)
    }

    // Favorites
    async addFavorite(userId: number, itemId: number): Promise<tableType.FavoriteItems> {
        const favorite = await this.queryFirstRow<tableType.FavoriteItems>(q.GET_FAVORITE_ITEM, userId, itemId)
        if (favorite) return favorite
        return (await this.queryFirstRow(q.ADD_FAVORITE_ITEM, userId, itemId))!
    }

    async removeFavorite(userId: number, itemId: number): Promise<void> {
        await this.queryWith(q.REMOVE_FAVORITE_ITEM, userId, itemId)
    }

    async isFavorite(userId: number, itemId: number): Promise<boolean> {
        return await this.queryExists(q.FAVORITE_ITEM_EXISTS, userId, itemId)
    }

    // #region Utility
    private async queryWith<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<QueryResult<T>> {
        return new Promise(resolve => {
            this.query(query, values).then(response => {
                resolve(response)
            }).catch(reason => {
                throw new DatabaseError(String(reason))
            })
        })
    }

    private async queryRows<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<T[]> {
        return (await this.queryWith<T>(query, ...values)).rows
    }

    private async queryFirstRow<T extends QueryResultRow>(query: string, ...values: unknown[]): Promise<T | undefined> {
        return (await this.queryRows<T>(query, ...values))[0]
    }

    private async queryExists<T extends tableType.Exists>(query: string, ...values: unknown[]): Promise<boolean> {
        return !!(await this.queryFirstRow<T>(query, ...values))!.exists
    }

    private async queryWithTransaction<T extends QueryResultRow>(queries: string[], returnQuery: string, ...values: unknown[]): Promise<QueryResult<T> | undefined> {
        let result: QueryResult<T> | undefined = undefined
        try {
            await this.queryWith('BEGIN')
            for (const query of queries) {
                result = await this.queryWith(query, ...values)
            }
            await this.queryWith('COMMIT')
            return result
        } catch (error) {
            await this.queryWith('ROLLBACK')
            throw error as DatabaseError
        }
    }

    // #endregion Queries
}

export default DatabaseClient
