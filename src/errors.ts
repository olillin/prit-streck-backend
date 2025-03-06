import { ResponseBody } from './types'
import { Response } from 'express'

// Pre-defined errors
export const errors = {
    // General errors
    missingRequiredProperty: (name: string) => [400, `Missing required property '${name}' in body`] as const,
    invalidProperty: (name: string) => [400, `Property '${name}' is invalid`] as const,
    unauthorized: [401, 'Unauthorized'],
    expiredToken: [401, 'Token has expired'],
    nbf: [401, 'Token has expired'],

    noPermission: [403, 'No permission to access this service'],
    unexpected: (details: string) => [500, `An unexpected issue occured. Please create an issue on GitHub. Details: ${details}`] as const,
    invalidGamma: [502, 'Received an invalid response from gamma'],
    unreachableGamma: [504, 'Unable to reach gamma'],

    // Login errors
    noCode: [401, 'No authorization code provided'],

    // Purchase
    itemCount: [400, 'Item count must be greater than 0'],
    purchaseInvisible: [403, 'Cannot purchase an invisible product'],
    userNotExist: [404, 'User does not exist'],
    itemNotExist: [404, 'Item does not exist'],

    // Item
    displayNameNotUnique: [403, 'Display name is not unique'],
    unknownSortMode: [400, 'Unknown sort order'],
    deletePurchasedItem: [403, 'An item that has been purchased cannot be deleted'],
} as const

export function sendError(res: Response, getError: (...args: unknown[]) => readonly [number, string], ...args: any[]): void
export function sendError(res: Response, code: number, message: string): void
export function sendError(res: Response, error: readonly [number, string]): void
export function sendError(res: Response, a: number | readonly [number, string] | ((...a: unknown[]) => readonly [number, string]), b?: string | any[]): void {
    if (res.headersSent) return

    let code: number
    let message: string

    if (a instanceof Function) {
        const getError = a as (...args: unknown[]) => [number, string]
        if (!Array.isArray(b)) b = [b]
        const args = b as unknown[]
        ;[code, message] = getError(...args)
    } else if (Number.isInteger(a)) {
        code = a as number
        message = b as string
    } else {
        const error = a as [number, string]
        ;[code, message] = error
    }

    const response: ResponseBody<never> = {
        error: {
            code: code,
            message: message,
        },
    }
    res.status(code).json(response)
}
