export class CachedValue<T> {
    readonly value: T
    readonly created: number
    readonly expiresAfterSeconds: number

    constructor(value: T, expiresAfterSeconds: number = 24 * 60 * 60) {
        this.value = value
        this.created = Date.now() / 1000
        this.expiresAfterSeconds = expiresAfterSeconds
    }

    expiresAt(): number {
        return this.created + this.expiresAfterSeconds
    }

    isExpired(): boolean {
        return Date.now() / 1000 >= this.expiresAt()
    }
}
