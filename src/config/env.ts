const PRIT_SUPER_GROUP_ID = '32da51ec-2854-4bc2-b19a-30dad5dcc501'

// Environment
export interface EnvironmentVariables {
    PORT?: string
    SUPER_GROUP_ID?: string

    GAMMA_CLIENT_ID: string
    GAMMA_CLIENT_SECRET: string
    GAMMA_REDIRECT_URI: string
    GAMMA_API_AUTHORIZATION: string

    PGPASSWORD: string
    PGUSER?: string
    PGHOST?: string
    PGPORT?: string
    PGDATABASE?: string

    JWT_SECRET: string
    JWT_ISSUER?: string
    JWT_EXPIRE_MINUTES?: string
}

// Remove 'optional' attributes from a type's properties
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property]
}

export const DEFAULT_ENVIRONMENT: Partial<Concrete<EnvironmentVariables>> = {
    PORT: '8080',
    SUPER_GROUP_ID: PRIT_SUPER_GROUP_ID,

    PGUSER: 'postgres',
    PGHOST: 'localhost',
    PGPORT: '5432',
    PGDATABASE: 'PritStreck',

    JWT_ISSUER: 'PritStreck',
    JWT_EXPIRE_MINUTES: '720',
}
export function withDefaults(env: EnvironmentVariables): Concrete<EnvironmentVariables> {
    return Object.assign(Object.assign({}, DEFAULT_ENVIRONMENT), env) as Concrete<EnvironmentVariables>
}

// Validate environment
export const requiredEnvironment: (keyof EnvironmentVariables)[] = ['GAMMA_CLIENT_ID', 'GAMMA_CLIENT_SECRET', 'GAMMA_API_AUTHORIZATION', 'GAMMA_REDIRECT_URI', 'PGPASSWORD', 'JWT_SECRET']
requiredEnvironment.forEach(required => {
    if (!(required in process.env)) {
        console.error(`Missing required environment variable: ${required}`)
        process.exit()
    }
})

const environment: Concrete<EnvironmentVariables> = withDefaults(process.env as unknown as EnvironmentVariables)
export default environment
