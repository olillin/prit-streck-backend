import request from "supertest"
import app from "server"

describe('GET /authorize', () => {
    it('should redirect to https://auth.chalmers.it', () => {
        request(app)
            .get('/authorize')
            .expect(307)
            .end((_err, res) => {
                expect(res.header['Location'])
                    .toMatch(/^https:\/\/auth.chalmers.it/)
            })
    })
})