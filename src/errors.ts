import { ResponseBody } from './types'
import { Response } from 'express'

// Pre-defined errors
export const errors = {
    // General errors
    unauthorized: [401, 'Unauthorized'],
    noPermission: [403, 'No permission to access this service'],
    unexpected: [500, 'An unexpected issue occured. Please create an issue on GitHub'],
    invalidGamma: [502, 'Received an invalid response from gamma'],
    unreachableGamma: [504, 'Unable to reach gamma'],

    // Login errors
    noCode: [401, 'No authorization code provided'],

    // Create user
    userExists: [403, 'User already exists'],
    userNotFoundGamma: [404, 'Unable to find user in gamma'],

    // Purchase
    itemCount: [400, 'Item count must be greater than 0'],
    purchaseInvisible: [403, 'Cannot purchase an invisible product'],
    userNotExist: [404, 'User does not exist'],
    itemNotExist: [404, 'Item does not exist'],

    // Create item
    displayNameExists: [403, 'Item with display name already exists'],

    // Get items
    unknownSortMode: [400, 'Unknown sort order'],

    // Update item
    propertyNotExist: (name: string) => [400, `Property '${name}' does not exist`] as const,
    displayNameNotUnique: [403, 'Display name is not unique'],

    // Delete item
    purchasedItem: [403, 'An item that has been purchased cannot be deleted'],
} as const

export function sendError(res: Response, getError: (...args: any[]) => readonly [number, string], ...args: any[]): void
export function sendError(res: Response, code: number, message: string): void
export function sendError(res: Response, error: readonly [number, string]): void
// export function sendError(res: Response, error: [number, string] | ((...a: any[]) => readonly [number, string]), ...args: any[]): void
export function sendError(res: Response, a: number | readonly [number, string] | ((...a: any[]) => readonly [number, string]), b?: string | any[]): void {
    let code: number
    let message: string

    if (a instanceof Function) {
        const getError = a as (...args: any[]) => [number, string]
        if (!Array.isArray(b)) b = [b]
        const args = b as any[]
        ;[code, message] = getError(...args)
    } else if (Number.isInteger(a)) {
        code = a as number
        message = b as string
    } else {
        const error = a as [number, string]
        ;[code, message] = error
    }

    const response: ResponseBody = {
        error: {
            code: code,
            message: message,
        },
    }
    res.status(code).json(response)
}
