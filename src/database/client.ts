import { GroupId, UserId } from 'gammait'
import { Client, QueryResult } from 'pg'
import * as q from './queries'
import * as row from './types'

class ValidationError extends Error {}

class DatabaseClient extends Client {
    validateDatabase() {
        // TODO: Validate that all tables exist and are properly configured.
    }

    private async fetch(query: string, ...values: any[]): Promise<QueryResult> {
        return new Promise(resolve => {
            this.query(query, values).then(response => {
                resolve(response)
            })
        })
    }

    private async fetchRows(query: string, ...values: any[]) {
        return (await this.fetch(query, ...values)).rows
    }

    private async fetchFirst(query: string, ...values: any[]) {
        return (await this.fetchRows(query, ...values))[0]
    }

    async createGroup(groupId: GroupId) {
        return await this.fetch(q.CREATE_GROUP, groupId)
    }

    async getGroup(groupId: GroupId): Promise<row.Groups | undefined> {
        return await this.fetchFirst(q.GET_GROUP, groupId)
    }

    async getGroups(): Promise<GroupId[]> {
        return await this.fetchRows(q.GET_GROUPS)
    }

    async groupExists(groupId: GroupId): Promise<boolean> {
        return (await this.fetchFirst(q.GROUP_EXISTS, groupId)).exists
    }

    async createUser(userId: UserId, groupId: GroupId) {
        return await this.fetch(q.CREATE_USER, userId, groupId)
    }

    async getUser(userId: UserId): Promise<row.Users | undefined> {
        return await this.fetchFirst(q.GET_USER, userId)
    }

    async getUsersInGroup(groupId: GroupId): Promise<row.Users[]> {
        return await this.fetchRows(q.GET_USERS_IN_GROUP, groupId)
    }

    async setBalance(userId: UserId, balance: number) {
        return await this.fetch(q.SET_BALANCE, userId, balance)
    }

    async userExists(userId: UserId): Promise<boolean> {
        return (await this.fetchFirst(q.USER_EXISTS, userId)).exists
    }

    async createItem(groupId: GroupId, displayName: string): Promise<QueryResult>
    async createItem(groupId: GroupId, displayName: string, iconUrl: string): Promise<QueryResult>
    async createItem(groupId: GroupId, displayName: string, iconUrl?: string): Promise<QueryResult> {
        if (iconUrl) {
            return await this.fetch(q.CREATE_ITEM_WITH_ICON, groupId, displayName, iconUrl)
        } else {
            return await this.fetch(q.CREATE_ITEM, groupId, displayName)
        }
    }

    async getItem(itemId: number) {
        return await this.fetchFirst(q.GET_ITEM, itemId)
    }

    async getItemsInGroup(groupId: GroupId): Promise<row.Items[] | undefined> {
        return await this.fetchRows(q.GET_ITEMS_IN_GROUP, groupId)
    }

    async addPrice(itemId: number, price: number, displayName: string) {
        return await this.fetch(q.CREATE_PRICE, itemId, price, displayName)
    }

    async getPricesForItem(itemId: number): Promise<row.Prices[]> {
        return await this.fetchRows(q.GET_PRICES_FOR_ITEM, itemId)
    }

    async createPurchase(groupId: GroupId, purchasedBy: UserId, purchasedFor: UserId) {
        return await this.fetch(q.CREATE_PURCHASE, groupId, purchasedBy, purchasedFor)
    }

    async getPurchase(purchaseId: number): Promise<row.Purchases | undefined> {
        return await this.fetchFirst(q.GET_PURCHASE, purchaseId)
    }

    async getPurchasesInGroup(groupId: GroupId): Promise<row.Purchases[] | undefined> {
        return await this.fetchRows(q.GET_PURCHASES_IN_GROUP, groupId)
    }

    async deletePurchase(purchaseId: number) {
        return await this.fetch(q.DELETE_PURCHASE, purchaseId)
    }

    async addPurchasedItem(purchaseId: number, itemId: number, quantity: number, purchasePrice: number) {
        return await this.fetch(q.ADD_PURCHASED_ITEM, purchaseId, itemId, quantity)
    }

    async getPurchasedItems(purchaseId: number) {
        return await this.fetchRows(q.GET_PURCHASED_ITEMS, purchaseId)
    }
}
export default DatabaseClient
