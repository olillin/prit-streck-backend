import { DockerComposeEnvironment, StartedDockerComposeEnvironment, StartedTestContainer, Wait } from 'testcontainers'
import { Client } from 'pg'
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

    // TODO: Implement tests
    it('Is decreased by purchases', async () => {

    })

    it('Is decreased by item price purchases', async () => {

    })

    it('Is decreased more with higher item counts', async () => {

    })

    it('Is decreased more with multiple items', async () => {

    })

    it('Is increased by deposits', async () => {

    })

    it('Is increased by total in deposits', async () => {

    })

    it('Is updated by purchases', async () => {

    })

    it('Respects removed purchases', async () => {

    })

    it('Respects removed deposits', async () => {

    })
})