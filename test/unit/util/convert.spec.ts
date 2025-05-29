/* eslint-disable no-unused-vars,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import * as arbitrary from '../../resources/dbArbitraries'
import { splitFullItemWithPrices, toItem } from '../../../src/util/convert'
import fc from 'fast-check'
import type * as tableType from 'database/types'
import type { Item } from 'types'

const joinFullItemWithPrices = (item: tableType.FullItem, prices: tableType.Prices[], favorite: boolean): tableType.FullItemWithPrices[] => prices.map((price) => ({
    ...item,
    price: price.price,
    price_display_name: price.display_name,
    favorite,
}))

describe('splitFullNameWithPrices', () => {

    it('returns an identical item', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, prices, favorite] = splitFullItemWithPrices(joinFullItemWithPrices(...args))
                expect(resultFullItem).toEqual<tableType.FullItem>(args[0])
            })
        )
    })

    it('returns the correct amount of prices', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(joinFullItemWithPrices(...args))
                expect(resultPrices).toHaveLength(resultPrices.length)
            })
        )
    })

    it('returns the correct prices in the correct order', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(joinFullItemWithPrices(...args))
                expect(resultPrices).toEqual<tableType.Prices[]>(resultPrices)
            })
        )
    })

    it('returns favorite correctly', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(joinFullItemWithPrices(...args))
                expect(resultFavorite).toStrictEqual(args[2])
            })
        )
    })
})

describe('toItem', () => {
    function assertCorrectlyMappedFields(resultItem: Item, input: tableType.FullItemWithPrices[]) {
            expect(resultItem.id).toStrictEqual(input[0].id)
            expect(resultItem.displayName).toStrictEqual(input[0].display_name)
            expect(resultItem.createdTime).toStrictEqual(input[0].created_time.getTime())
            expect(resultItem.stock).toStrictEqual(input[0].stock)
            expect(resultItem.timesPurchased).toStrictEqual(input[0].times_purchased)
            expect(resultItem.visible).toStrictEqual(input[0].visible)
            expect(resultItem.favorite).toStrictEqual(input[0].favorite)
            if (input[0].icon_url == null) {
                expect(resultItem.icon).toBeUndefined()
            } else {
                expect(resultItem.icon).toStrictEqual(input[0].icon_url)
            }

            for (const [i, fullItemWithPrice] of input.entries()) {
                expect(resultItem.prices[i].price).toStrictEqual(fullItemWithPrice.price)
                expect(resultItem.prices[i].displayName).toStrictEqual(fullItemWithPrice.price_display_name)
            }
    }

    it('maps fields correctly', () => {
        fc.assert(fc.property(arbitrary.fullItemWithPricesTuple, ([fullItem, prices, favorite]) => {
            const item = toItem(fullItem, prices, favorite)
            const args = joinFullItemWithPrices(fullItem, prices, favorite)
            assertCorrectlyMappedFields(item, args)
        }))
    })

    it('maps fields correctly with FullItemWithPrices[]', () => {
        fc.assert(fc.property(arbitrary.fullItemWithPrices, (args) => {
            const item = toItem(args)
            assertCorrectlyMappedFields(item, args)
        }))
    })
})
