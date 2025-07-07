export enum ItemFlags {
    INVISIBLE
}

export interface ItemFlagsMap {
    invisible: boolean
}

export enum TransactionFlags {
    REMOVED
}

export interface TransactionFlagsMap {
    removed: boolean
}

export type Flag = ItemFlags | TransactionFlags
export type FlagsMap = ItemFlagsMap | TransactionFlagsMap

/**
 * Get the value of a flag from a flag int and a flag index
 * @param flagsInt The flags data
 * @param flagIndex Which flag to get, as an index from the least significant bit
 */
export function getFlag(flagsInt: number | null | undefined, flagIndex: number): boolean {
    if (!flagsInt) return false
    return !!((flagsInt >> flagIndex) & 0b1)
}

/**
 * Get all transaction flags from a flag int
 * @param flagsInt The flags data
 */
export function getTransactionFlags(flagsInt: number | null | undefined): TransactionFlagsMap {
    return {
        removed: getFlag(flagsInt, TransactionFlags.REMOVED),
    }
}

/**
 * Get all item flags from a flag int
 * @param flagsInt The flags data
 */
export function getItemFlags(flagsInt: number | null | undefined): ItemFlagsMap {
    return {
        invisible: getFlag(flagsInt, ItemFlags.INVISIBLE),
    }
}

/** Combine a map of item flags to an integer */
export function createItemFlags(flags: Partial<ItemFlagsMap>): number {
    return Number(flags.invisible) << ItemFlags.INVISIBLE
}

/** Combine a map of transaction flags to an integer */
export function createTransactionFlags(flags: Partial<TransactionFlagsMap>): number {
    return Number(flags.removed) << TransactionFlags.REMOVED
}

// function updateFlagsWithIndices(oldFlags: number | null | undefined, indexFlags: [Flag, boolean?][]): number {
//     const falseIndices = indexFlags.filter(([,value]) => value === false).map(([i,]) => i)
//     const trueIndices = indexFlags.filter(([,value]) => value === true).map(([i,]) => i)
//
//     const fullMask = Math.floor(Math.log2(oldFlags ?? 0) + 1)
//     const falseMask =
// }
//
// /** Create a new flag int with flags in the map replaced with new values */
// export function updateItemFlags(oldFlags: number | null | undefined, flags: Partial<ItemFlagsMap>): number {
//     const offsetFlags: [Flag, boolean?][] = [
//         [ItemFlags.INVISIBLE, flags.invisible]
//     ]
//     return updateFlagsWithIndices(oldFlags, offsetFlags)
// }
//
// /** Create a new flag int with flags in the map replaced with new values */
// export function updateTransactionFlags(oldFlags: number | null | undefined, flags: Partial<TransactionFlagsMap>): number {
//     const offsetFlags: [Flag, boolean?][] = [
//         [TransactionFlags.REMOVED, flags.removed]
//     ]
//     return updateFlagsWithIndices(oldFlags, offsetFlags)
// }
