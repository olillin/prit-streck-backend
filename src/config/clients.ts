import { AuthorizationCode, ClientApi } from 'gammait'
import DatabaseClient from '../database/client'
import env from './env'

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Database
const db = new DatabaseClient({
    user: env.PGUSER,
    password: env.PGPASSWORD,
    host: env.PGHOST,
    port: parseInt(env.PGPORT),
    database: env.PGDATABASE,
})
let connecting = false
let connected = false
db.on('end', () => {
    connected = false
})
db.on('error', () => {
    connected = false
})
function connectToDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.connect((err) => {
            if (err) reject(err)
            resolve()
        })
    })
}
async function shutdownGracefully(): Promise<void> {
    console.log('Shutting down gracefully')
    await db.end()
    console.log('Database connection closed')
    process.exit(0)
}
process.on('SIGINT', shutdownGracefully)
process.on('SIGTERM', shutdownGracefully)

export async function database(): Promise<DatabaseClient> {
    if (!connected) {
        if (connecting) {
            while (connecting && !connected) {
                await sleep(5)
            }
        } else {
            await connectToDatabase().catch(err => {
                console.error("Failed to connect to database: " + err.message)
                process.exit(1)
            })
            await db.query("SET client_encoding = 'UTF8';")
            connecting = false
            connected = true
        }
    }
    return db
}

// Gamma Authorization Code Flow
export const authorizationCode = new AuthorizationCode({
    clientId: env.GAMMA_CLIENT_ID,
    clientSecret: env.GAMMA_CLIENT_SECRET,
    redirectUri: env.GAMMA_REDIRECT_URI,
    scope: ['openid', 'profile'],
})

// Gamma Client API
export const clientApi = new ClientApi({
    authorization: env.GAMMA_API_AUTHORIZATION,
})
