import express from 'express'
import { getCurrentPritIconUrl } from './gamma'

const { API_AUTHORIZATION } = process.env
if (!API_AUTHORIZATION) {
    console.error('Missing required environment variable API_AUTHORIZATION')
    process.exit()
}

const app = express()

app.get('/prit-icon', async (req, res) => {
    getCurrentPritIconUrl(API_AUTHORIZATION)
        .then(url => {
            res.redirect(url)
        })
        .catch(reason => res.status(500).end(`Failed to get icon: ${reason}`))
})

const PORT = parseInt(process.env.PORT ?? '8080')
app.listen(PORT)
console.log(`Listening on port ${PORT}`)
