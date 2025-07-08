import * as fs from "node:fs";

const PRIT_SUPER_GROUP_ID = '32da51ec-2854-4bc2-b19a-30dad5dcc501'

// Environment
export interface EnvironmentVariables {
    PORT?: string
    SUPER_GROUP_ID?: string
    EXPOSE_CORS?: string

    GAMMA_CLIENT_ID: string
    GAMMA_CLIENT_SECRET: string
    GAMMA_REDIRECT_URI: string
    GAMMA_API_AUTHORIZATION: string

    PGPASSWORD?: string
    PGUSER?: string
    PGHOST?: string
    PGPORT?: string
    PGDATABASE?: string

    JWT_SECRET: string
    JWT_ISSUER?: string
    JWT_EXPIRES_IN?: string
}

// Remove 'optional' attributes from a type's properties
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property]
}

function defineDefaults<T extends Partial<EnvironmentVariables>>(env: T) {
    return env
}

export const DEFAULT_ENVIRONMENT = defineDefaults({
    PORT: '8080',
    SUPER_GROUP_ID: PRIT_SUPER_GROUP_ID,
    EXPOSE_CORS: 'false',

    PGPASSWORD: 'postgres',
    PGUSER: 'postgres',
    PGHOST: 'localhost',
    PGPORT: '5432',
    PGDATABASE: 'prit_streck',

    JWT_ISSUER: 'prit_streck',
    JWT_EXPIRES_IN: '43200',
} as const)

export function withDefaults(
    env: EnvironmentVariables
): Concrete<EnvironmentVariables> {
    return Object.assign(
        Object.assign({}, DEFAULT_ENVIRONMENT),
        env
    ) as Concrete<EnvironmentVariables>
}

export type FileEnvironmentVariables = EnvironmentVariables & {
    [K in keyof EnvironmentVariables as `${K}_FILE`]: string
}
export function resolveFileEnvironment(env: FileEnvironmentVariables): EnvironmentVariables {
    const out: Partial<EnvironmentVariables> = {}
    for (const k in env) {
        const key = k as keyof FileEnvironmentVariables
        // Copy environment
        out[key as keyof EnvironmentVariables] = env[key]

        // Resolve _FILE environment
        if (key.endsWith("_FILE")) {
            const path = env[key]!
            const shortKey = key.substring(0, key.length-5) as keyof EnvironmentVariables
            if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
                console.warn(`Unable to load environment variable ${shortKey} from ${path}, file not found`)
                continue
            }
            out[shortKey] = fs.readFileSync(path).toString().trim()
        }
    }
    return out as EnvironmentVariables
}

// Validate environment
export const requiredEnvironment: readonly (keyof EnvironmentVariables)[] = [
    'GAMMA_CLIENT_ID',
    'GAMMA_CLIENT_SECRET',
    'GAMMA_API_AUTHORIZATION',
    'GAMMA_REDIRECT_URI',
    'JWT_SECRET',
]

const environment: Concrete<EnvironmentVariables> = withDefaults(
    resolveFileEnvironment(process.env as unknown as FileEnvironmentVariables)
)
export default environment

/**
 * Check if all required environment variables are present
 * @returns `true` if this is the case, else `false`
 */
export function validateEnvironment(logErrors: boolean = true): boolean {
    let valid = true
    requiredEnvironment.forEach(required => {
        if (!(required in environment)) {
            if (logErrors) {
                console.error(`Missing required environment variable: ${required}`)
            }
            valid = false
        }
    })
    return valid
}
