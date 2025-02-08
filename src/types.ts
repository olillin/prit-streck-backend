interface ApiResponse {
    data?: ApiResponseData
    error?: ApiError
}

interface ApiResponseData {}

interface ApiError {
    message: string
}

interface ProfileResponse extends ApiResponseData {
    
}

type Id = number

interface Profile {
    id: Id
    nick: string
}

interface ProfileSetup extends Partial<Profile> {
    nick: string
}

interface Product {
    id: Id
    added_time: number
    icon: string
    display_name: string
    price: number
    times_purchased: number
    archived: boolean
}

interface ProductSetup extends Partial<Product> {
    display_name: string
    price: number
    icon?: string
}

interface Purchase {
    id: Id
    count: number
}

type PurchaseSetup = Purchase