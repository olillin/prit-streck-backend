import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer, Wait } from 'testcontainers'
import { Client, QueryResult } from 'pg'
import { DEFAULT_ENVIRONMENT } from '../../../src/config/env'

const defaultEnv = DEFAULT_ENVIRONMENT

const dockerComposePath = './'
const dockerComposeFiles = [
    'docker-compose.yaml',
    'docker-compose.test.yaml'
]

const timeoutMs = 30_000

let compose: StartedDockerComposeEnvironment
let container: StartedTestContainer
let pgClient: Client

beforeAll(async () => {
    // Start test container
    compose = await new DockerComposeEnvironment(dockerComposePath, dockerComposeFiles)
        .withWaitStrategy("db-1", Wait.forHealthCheck())
        .up(["db"])
    container = compose.getContainer("db-1")

    // Connect to Postgres
    pgClient = new Client({
        user: defaultEnv.PGUSER,
        database: defaultEnv.PGDATABASE,
        password: 'testing',
        port: container.getMappedPort(5432),
        host: container.getHost(),
    })
    await pgClient.connect()
}, timeoutMs)

afterAll(async () => {
    await pgClient.end()
    await compose.stop()
})

// Isolate each test with Postgres transactions
beforeEach(async () => {
    await pgClient.query('BEGIN;')
})
afterEach(async () => {
    await pgClient.query('ROLLBACK;')
})

describe('User balance', () => {

    it('Exists on prit_streck.user_balances as balance', async () => {
        const result = await pgClient.query(`
            SELECT EXISTS(SELECT column_name FROM information_schema.columns
            WHERE table_catalog = 'prit_streck'
                AND table_name = 'user_balances'
                AND column_name = 'balance');
        `)
        expect(result.rows[0].exists).toStrictEqual(true)
    })

    async function getBalance(userId: number): Promise<number> {
        const query = 'SELECT balance FROM user_balances WHERE user_id = $1'
        const result = (await pgClient.query(query, [userId])) as QueryResult<{ balance: string }>
        return parseFloat(result.rows[0].balance)
    }

    it('Is decreased by purchases', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO purchases(group_id, created_for, created_by)
                              VALUES (1, 1, 2)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 1, 'Product 1', 5, 'Price name', 1)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toBeLessThan(balanceBefore)
    })

    it('Is decreased by the item price on purchase', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`
            INSERT INTO purchases
                (group_id, created_for, created_by)
                VALUES (1, 1, 2);
            INSERT INTO purchased_items
                (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                VALUES (1, 1, 'Product 1', 5, 'Price name', 1);
        `);

        const balanceAfter = await getBalance(1)

        expect(balanceAfter - balanceBefore).toStrictEqual(-5)
    })

    it('Is decreased more with higher item counts', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO purchases(group_id, created_for, created_by)
                              VALUES (1, 1, 2)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 1, 'Product 1', 5, 'Price name', 3)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter - balanceBefore).toStrictEqual(-15)
    })

    it('Is decreased more with multiple items', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO purchases(group_id, created_for, created_by)
                              VALUES (1, 1, 2)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 1, 'Product 1', 5, 'Price 1 name', 1)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 2, 'Product 2', 10, 'Price 2 name', 1)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter - balanceBefore).toStrictEqual(-15)
    })

    it('Is increased by deposits', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO deposits(group_id, created_for, created_by, total)
                              VALUES (1, 1, 2, 10)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toBeGreaterThan(balanceBefore)
    })

    it('Is increased by total in deposits', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO deposits(group_id, created_for, created_by, total)
                              VALUES (1, 1, 2, 10)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter - balanceBefore).toStrictEqual(10)
    })

    it('Ignores other users\' purchases', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO purchases(group_id, created_for, created_by)
                              VALUES (1, 2, 1)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 1, 'Product 1', 5, 'Price name', 1)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toStrictEqual(balanceBefore)
    })

    it('Ignores other users\' deposits', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO deposits(group_id, created_for, created_by, total)
                              VALUES (1, 2, 1, 10)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toStrictEqual(balanceBefore)
    })

    it('Ignores removed purchases', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO purchases(group_id, created_for, created_by, flags)
                              VALUES (1, 1, 2, 0b1)`)
        await pgClient.query(`INSERT INTO purchased_items
                              (transaction_id, item_id, display_name, purchase_price, purchase_price_name, quantity)
                              VALUES (1, 1, 'Product 1', 5, 'Price name', 1)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toStrictEqual(balanceBefore)
    })

    it('Ignores removed deposits', async () => {
        const balanceBefore = await getBalance(1)

        await pgClient.query(`INSERT INTO deposits(group_id, created_for, created_by, total, flags)
                              VALUES (1, 2, 1, 10, 0b1)`)

        const balanceAfter = await getBalance(1)

        expect(balanceAfter).toStrictEqual(balanceBefore)
    })
})