import { AuthorizationCode, ClientApi } from 'gammait'
import DatabaseClient from '../database/client'
import env from './env'

// Database
export const database = new DatabaseClient({
    user: env.PGUSER,
    password: env.PGPASSWORD,
    host: env.PGHOST,
    port: parseInt(env.PGPORT),
    database: env.PGDATABASE,
})
async function shutdownGracefully(): Promise<void> {
    console.log('Shutting down gracefully')
    await database.end()
    console.log('Database connection closed')
    process.exit(0)
}
process.on('SIGINT', shutdownGracefully)
process.on('SIGTERM', shutdownGracefully)

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
