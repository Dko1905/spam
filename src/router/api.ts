import { Request, Response, Router } from 'express'
import * as WebSocket from 'ws'

import { CaptchaManager } from '../util/captcha_manager'
import { WebSocketManager, Message } from '../util/websocket_manager'

const create_router = (captcha_lifetime: number, wss: WebSocket.Server) => {
	const router = Router()

	const captcha_manager = new CaptchaManager(captcha_lifetime)
	const websocket_manager = new WebSocketManager(wss, 50)

	// Map corresponding ip to ip id
	const ip_id_map: Map<string, number> = new Map()
	let ip_id_free = 1

	// Extract the remote ip correctly.
	const remote_ip = (req: Request) =>
		req.headers['x-forwarded-for'] ? 
		(req.headers['x-forwarded-for'] as string).split(/\s*,\s*/)[0] :
		req.socket.remoteAddress as string
	const get_ip_id = (ip: string): number => {
		if (ip_id_map.has(ip)) {
			return ip_id_map.get(ip)!!
		} else {
			ip_id_map.set(ip, ip_id_free)
			ip_id_free += 1
			return ip_id_free - 1
		}
	}

	/**
	 * @description Get a new captcha from server.
	 * @returns 200, 429, 500.
	 */
	router.get('/captcha', async (req: Request, res: Response) => {
		try {
			const ip = remote_ip(req)

			const buffer = captcha_manager.get_captcha(ip)

			res.status(200).type('image/png').end(await buffer)
		} catch (e) {
			console.error(e)
			res.status(500).type('text').end('KO')
		}
	})
	/**
	 * @description Send a message to global chat room.
	 * @returns 200, 401, 403, 429, 500.
	 */
	router.post('/send', async (req: Request, res: Response) => {
		let content: string
		let captcha_result: string
		if (
			req.body?.content == undefined ||
			req.body?.captcha_result == undefined
		) {
			if (req.body?.captcha_result == undefined) {
				res.status(401).type('text').end('KO')
			} else {
				res.status(400).type('text').end('KO')
			}
			return
		} else {
			content = req.body!!.content
			captcha_result = req.body!!.captcha_result
		}
		
		try {
			const ip = remote_ip(req)

			if (!captcha_manager.check_captcha(ip, captcha_result)) {
				res.status(403).type('text').end()
				return
			}

			if (websocket_manager.online_map.get(remote_ip(req)) == 0) {
				websocket_manager.online_map.set(remote_ip(req), 1)
				websocket_manager.send_msg(new Message(
					0,
					`Person joined, ${websocket_manager.online_count()} currently online.`
				))
			}
			websocket_manager.send_msg(new Message(
				get_ip_id(ip),
				content.substr(0, 256)
			))

			res.status(200).type('test').end('OK')
		} catch (e) {
			console.error(e)
			res.status(500).type('text').end('KO')
		}
	})

	return router
}

export default create_router
