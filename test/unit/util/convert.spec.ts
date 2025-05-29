import * as arbitrary from '../../resources/dbArbitraries'
import { splitFullItemWithPrices } from '../../../src/util/convert'
import fc from 'fast-check'
import * as tableType from 'database/types'

describe('splitFullNameWithPrices', () => {
    const join = (item: tableType.FullItem, prices: tableType.Prices[], favorite: boolean): tableType.FullItemWithPrices[] => prices.map((price) => ({
                ...item,
                price: price.price,
                price_display_name: price.display_name,
                favorite,
            }))

    it('returns an identical item', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, prices, favorite] = splitFullItemWithPrices(join(...args))
                expect(resultFullItem).toEqual<tableType.FullItem>(args[0])
            })
        )
    })

    it('returns the correct amount of prices', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(join(...args))
                expect(resultPrices).toHaveLength(resultPrices.length)
            })
        )
    })

    it('returns the correct prices in the correct order', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(join(...args))
                expect(resultPrices).toEqual<tableType.Prices[]>(resultPrices)
            })
        )
    })

    it('returns favorite correctly', () => {
        fc.assert(
            fc.property(arbitrary.fullItemWithPricesTuple, (args) => {
                const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(join(...args))
                expect(resultFavorite).toStrictEqual(args[2])
            })
        )
    })
})