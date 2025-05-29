import type * as tableType from 'database/types'
import { splitFullItemWithPrices } from '../../../src/util/convert'

// Example data
const fullItem: tableType.FullItem = {
    id: 1,
    group_id: 2,
    display_name: 'product name',
    icon_url: null,
    created_time: new Date('2025-05-29T12:00:00.000Z'),
    visible: true,

    times_purchased: 0,
    stock: 10,
}
const favorite = true
const cheapPrice: tableType.Prices = { item_id: 1, price: 20, display_name: 'cheap price' }
const expensivePrice: tableType.Prices = { item_id: 1, price: 30, display_name: 'expensive price' }

const fullItemWithPrices: tableType.FullItemWithPrices[] = [{
    ...fullItem, favorite, price: cheapPrice.price, price_display_name: cheapPrice.display_name,
}, {
    ...fullItem, favorite, price: expensivePrice.price, price_display_name: expensivePrice.display_name,
}]

describe('splitFullNameWithPrices', () => {

    // Run function
    const [resultFullItem, resultPrices, resultFavorite] = splitFullItemWithPrices(fullItemWithPrices)

    // Assert
    it('returns an identical item', () => {
        expect(resultFullItem).toStrictEqual(fullItem)
    })

    it('returns the correct amount of prices', () => {
        expect(resultPrices).toHaveLength(2)
    })

    it('returns the correct prices in the correct order', () => {
        expect(resultPrices[0]).toStrictEqual(cheapPrice)
        expect(resultPrices[1]).toStrictEqual(expensivePrice)
    })

    it('is a favorite', () => {
        expect(resultFavorite).toStrictEqual(true)
    })
})