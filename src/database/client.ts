import {GroupId, UserId} from 'gammait'
import {Client, ClientConfig, QueryResult, QueryResultRow} from 'pg'
import * as q from './queries'
import * as tableType from './types'
import {Price} from '../types'

const REQUIRED_TABLES = ['deposits', 'favorite_items', 'full_user', 'groups', 'items', 'prices', 'purchased_items', 'purchases', 'transactions', 'user_balances', 'users', 'users_total_deposited', 'users_total_purchased',]

export const legalItemColumns = ['id', 'group_id', 'display_name', 'icon_url', 'created_time', 'visible'] as const
export type LegalItemColumn = (typeof legalItemColumns)[number]

class DatabaseClient {
    pg: Client

    isReady: boolean = false
    invalid: boolean = false

    constructor(config?: string | ClientConfig) {
        this.pg = new Client(config);

        // Connect to database
        this.pg.connect()
            // Start validation
            .then(() => this.validateDatabase())
            .then(() => {
                console.log('Database validated successfully')
                return this.query("SET client_encoding = 'UTF8';")
            }).then(() => this.isReady = true)
            .catch(reason => {
                console.error('Creating database client failed: ' + reason)
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
                    if (!tables) {
                        throw "Could not get tables"
                    }
                    // Check if all required tables exist
                    const existingTables = tables.map(row => row.table_name)
                    const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));
                    if (missingTables.length > 0) {
                        throw "Database is missing tables"
                    }

                    // All checks pass
                    resolve()
                    this.invalid = false
                })
                .catch(reason => {
                    // Validation failed
                    reject('Database validation failed' + (reason ? `: ${reason}` : ''))
                    this.invalid = true
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

    // #region Utility
    /**
     * Query a statement or transaction
     * @param query the query
     * @param args the query arguments
     * @private
     */
    private async query<T extends QueryResultRow>(query: string | string[], ...args: unknown[]): Promise<QueryResult<T> | undefined> {
        if (typeof query === 'string') {
            return this.queryWithStatement(query, ...args)
        } else {
            return this.queryWithTransaction(query, ...args)
        }
    }

    /**
     * Query a statement
     * @param statement a statement
     * @param args the query arguments
     * @return the result of the statement
     * @private
     */
    private async queryWithStatement<T extends QueryResultRow>(statement: string, ...args: unknown[]): Promise<QueryResult<T>> {
        return new Promise(resolve => {
            this.pg.query(statement, args).then(response => {
                resolve(response)
            })
        })
    }

    /**
     * Query a transaction
     * @param transaction a transaction, which is a list of statements
     * @param args the query arguments
     * @throws Error if the transaction is empty
     * @throws DatabaseError if the transaction fails
     * @return the result of the last statement that returned a value, or `undefined` if no statements returned a value
     * @private
     */
    private async queryWithTransaction<T extends QueryResultRow>(transaction: string[], ...args: unknown[]): Promise<QueryResult<T> | undefined> {
        if (transaction.length === 0) {
            throw new Error("Transaction must contain at least one statement")
        }

        let lastResult: QueryResult<T> | undefined = undefined
        try {
            await this.query('BEGIN')
            for (const statement of transaction) {
                const result = await this.queryWithStatement<T>(statement, ...args)
                if (result.rowCount !== null) {
                    lastResult = result
                }
            }

            await this.query('COMMIT')
            return lastResult
        } catch (error) {
            await this.query('ROLLBACK')
            throw error
        }
    }

    /**
     * Get the rows returned by a query
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @return the rows returned, or `undefined` if no rows were returned
     * @private
     */
    private async queryRows<T extends QueryResultRow>(query: string | string[], ...args: unknown[]): Promise<T[]|undefined> {
        return (await this.query<T>(query, ...args))?.rows
    }

    /**
     * Get the first row returned by a query
     * @param query a statement or transaction
     * @param args the query arguments
     * @return the first row returned, or `undefined` if no rows were returned
     * @private
     */
    private async queryFirstRow<T extends QueryResultRow>(query: string | string[], ...args: unknown[]): Promise<T|undefined> {
        const rows = await this.queryRows<T>(query, ...args)
        if (!rows || rows.length === 0)
            return undefined
        return rows[0]
    }

    /**
     * Get the first value of the first row. Should only be used with queries which only return one column, as Postgres
     * does not care about a column order.
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @private
     */
    private async queryFirstValue(query: string | string[], ...args: unknown[]): Promise<unknown> {
        const row = await this.queryFirstRow(query, ...args)
        if (!row) throw new Error('Cannot get value, query result is empty')
        const values = Object.values(row)
        if (values.length === 0) throw new Error('Cannot get value, query result is empty')
        return values[0]
    }

    /**
     * Get the first value of the first row as a boolean. Should only be used with queries which only return one column,
     * as Postgres does not care about column order.
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @private
     */
    private async queryFirstBoolean(query: string | string[], ...args: unknown[]): Promise<boolean> {
        return !!(await this.queryFirstValue(query, ...args))
    }

    /**
     * Get the first value of the first row as a string. Should only be used with queries which only return one column,
     * as Postgres does not care about column order.
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @private
     */
    private async queryFirstString(query: string | string[], ...args: unknown[]): Promise<string> {
        return String(await this.queryFirstValue(query, ...args))
    }

    /**
     * Get the first value of the first row as an integer. Should only be used with queries which only return one
     * column, as Postgres does not care about column order.
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @private
     */
    private async queryFirstInt(query: string | string[], ...args: unknown[]): Promise<number> {
        return parseInt(await this.queryFirstString(query, ...args))
    }

    /**
     * Get the first value of the first row as a float. Should only be used with queries which only return one column,
     * as Postgres does not care about column order.
     * @param query a statement or transaction
     * @param args the query arguments
     * @throws Error if the query result is empty
     * @private
     */
    private async queryFirstFloat(query: string | string[], ...args: unknown[]): Promise<number> {
        return parseFloat(await this.queryFirstString(query, ...args))
    }
    // #endregion Utility

    // #region Queries

    //  Groups
    async createGroup(gammaGroupId: GroupId): Promise<tableType.Groups> {
        return (await this.queryFirstRow<tableType.Groups>(q.CREATE_GROUP, gammaGroupId))!
    }

    async softCreateGroupAndUser(gammaGroupId: GroupId, gammaUserId: UserId): Promise<tableType.FullUser> {
        return (await this.queryWithTransaction<tableType.FullUser>(
            q.SOFT_CREATE_GROUP_AND_USER, gammaGroupId, gammaUserId
        ))!.rows[0]
    }

    async getGroup(groupId: number): Promise<tableType.Groups | undefined> {
        return await this.queryFirstRow<tableType.Groups>(q.GET_GROUP, groupId)
    }

    async getGroups(): Promise<tableType.Groups[]> {
        return await this.queryRows(q.GET_GROUPS)
    }

    async groupExists(groupId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.GROUP_EXISTS, groupId)
    }

    async gammaGroupExists(gammaGroupId: GroupId): Promise<boolean> {
        return await this.queryFirstBoolean(q.GAMMA_GROUP_EXISTS, gammaGroupId)
    }

    // Users
    async createUser(userId: UserId, groupId: GroupId): Promise<tableType.Users> {
        return (await this.queryFirstRow(q.CREATE_USER, userId, groupId))!
    }

    async getUser(userId: number): Promise<tableType.Users | undefined> {
        return await this.queryFirstRow<tableType.Users>(q.GET_USER, userId)
    }

    async getUsersInGroup(groupId: number): Promise<tableType.Users[]> {
        return await this.queryRows(q.GET_USERS_IN_GROUP, groupId)
    }

    async setBalance(userId: number, balance: number) {
        return await this.queryFirstRow(q.SET_BALANCE, userId, balance)
    }

    async userExists(userId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.USER_EXISTS, userId)
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
        return await this.queryFirstRow<tableType.Items>(q.GET_ITEM, itemId)
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
        return await this.queryFirstBoolean(q.ITEM_EXISTS, itemId)
    }

    async itemExistsInGroup(itemId: number, groupId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.ITEM_EXISTS_IN_GROUP, itemId, groupId)
    }

    async itemNameExistsInGroup(name: string, groupId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.ITEM_NAME_EXISTS_IN_GROUP, name, groupId)
    }

    async isItemVisible(itemId: number): Promise<boolean> {
        return (await this.getItem(itemId))?.visible === true
    }

    async deleteItem(itemId: number): Promise<void> {
        await this.query(q.DELETE_ITEM, itemId)
    }

    // Prices
    async addPrice(itemId: number, price: number, displayName: string): Promise<tableType.Prices> {
        return (await this.queryFirstRow(q.CREATE_PRICE, itemId, price, displayName))!
    }

    async getPricesForItem(itemId: number): Promise<tableType.Prices[]> {
        return await this.queryRows(q.GET_PRICES_FOR_ITEM, itemId)
    }

    async removePricesForItem(itemId: number): Promise<void> {
        await this.query(q.REMOVE_PRICES_FOR_ITEM, itemId)
    }

    // Transactions
    async createTransaction(groupId: number, createdBy: number, createdFor: number): Promise<tableType.Transactions> {
        return (await this.queryFirstRow(q.CREATE_TRANSACTION, groupId, createdBy, createdFor))!
    }

    async getTransaction(transactionId: number): Promise<tableType.Transactions | undefined> {
        return await this.queryFirstRow(q.GET_TRANSACTION, transactionId)
    }

    async transactionExistsInGroup(transactionId: number, groupId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.TRANSACTION_EXISTS_IN_GROUP, transactionId, groupId)
    }

    async countTransactionsInGroup(groupId: number): Promise<number> {
        return await this.queryFirstInt(q.COUNT_TRANSACTIONS_IN_GROUP, groupId)
    }

    async getTransactionsInGroup(groupId: number): Promise<tableType.Transactions[]> {
        return await this.queryRows(q.GET_TRANSACTIONS_IN_GROUP, groupId)
    }

    async deleteTransaction(transactionId: number): Promise<void> {
        await this.query(q.DELETE_TRANSACTION, transactionId)
    }

    // Deposit
    async createDeposit(transactionId: number, total: number): Promise<tableType.Deposits> {
        return (await this.queryFirstRow(q.CREATE_DEPOSIT, transactionId, total))!
    }

    async getDeposit(transactionId: number): Promise<tableType.Deposits | undefined> {
        return await this.queryFirstRow(q.GET_DEPOSIT, transactionId)
    }

    async deleteDeposit(transactionId: number): Promise<void> {
        await this.query(q.DELETE_DEPOSIT, transactionId)
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

    // Favorites
    async addFavorite(userId: number, itemId: number): Promise<tableType.FavoriteItems> {
        return (await this.queryWithTransaction<tableType.FavoriteItems>(q.ADD_FAVORITE_ITEM, userId, itemId))!.rows[0]
    }

    async removeFavorite(userId: number, itemId: number): Promise<void> {
        await this.query(q.REMOVE_FAVORITE_ITEM, userId, itemId)
    }

    async isFavorite(userId: number, itemId: number): Promise<boolean> {
        return await this.queryFirstBoolean(q.FAVORITE_ITEM_EXISTS, userId, itemId)
    }
}

export default DatabaseClient
