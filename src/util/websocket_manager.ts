import * as WebSocket from 'ws'
import { Request } from 'express'

class Message {
	from_id: number
	content: string

	constructor(from_id: number, content: string) {
		this.from_id = from_id
		this.content = content
	}
}

class WebSocketManager {
	wss: WebSocket.Server
	message_backlog: Array<Message> = []
	message_backlog_len: number
	online_map = new Map<string, number>()

	remote_ip = (req: Request) =>
	            req.headers['x-forwarded-for'] ? 
	            (req.headers['x-forwarded-for'] as string).split(/\s*,\s*/)[0] :
	            req.socket.remoteAddress as string
	
	online_count = () => {
		let count = 0
		this.online_map.forEach((val, key) => {
			count += val
		})
		return count
	}

	send_msg = (msg: Message) => {
		if (this.message_backlog.length > this.message_backlog_len) {
			this.message_backlog.shift()
		}
		this.message_backlog.push(msg)
		this.wss.clients.forEach((client) => {
			if (client.readyState == WebSocket.OPEN) {
				client.send(JSON.stringify(msg))
			}
		})
	}

	constructor(wss: WebSocket.Server, message_backlog_len: number) {
		this.wss = wss
		this.message_backlog_len = message_backlog_len
		wss.on('connection', (ws, req: Request) => {
			if (this.online_map.get(this.remote_ip(req)) == undefined) {
				this.online_map.set(this.remote_ip(req), 0)
			}
			this.message_backlog.forEach(msg => {
				ws.send(JSON.stringify(msg))
			})
			ws.on('close', () => {
				if (this.online_map.get(this.remote_ip(req)) == 1) {
					this.online_map.set(this.remote_ip(req), 0)
					this.send_msg(new Message(
						0,
						`Person left, ${this.online_count()} currently online.`
					))
				}
			})
		})
	}

	
}

export { WebSocketManager, Message }
