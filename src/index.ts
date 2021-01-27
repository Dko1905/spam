import express, {static as estatic, Request, Response, json as ejson} from 'express'
import text_to_picture from 'text-to-picture-kazari'
import random_letter from 'random-letter'
import rate_limit from 'express-rate-limit'
import * as ws from 'ws'
import * as http from 'http'

import create_api_router from './router/api'

const PORT: number = process.env.PORT ? +process.env.PORT : +"8080"
const CAPTCHA_LIFETIME = 1000 * 60 * 60

const main = () => {
	const app = express()
	const server = http.createServer(app)
	const wss = new ws.Server({server})

	app.use(estatic('static/'))
	app.use(ejson({
		strict: true
	}))
	app.use('/api/captcha', rate_limit({ // 8 times per 20 seconds
		windowMs: 5 * 1000,
		max: 3
	}))
	app.use('/api/send', rate_limit({ // 3 times per second
		windowMs: 1000,
		max: 2
	}))

	app.use('/api', create_api_router(CAPTCHA_LIFETIME, wss))

	server.listen(PORT, () => {
		console.log(`Started on http://[::1]:${PORT}/`)
	})
}

main()
