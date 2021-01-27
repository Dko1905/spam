var const_ws_url = "ws://192.168.1.23:8080/"
var const_send_url = "http://192.168.1.23:8080/api/send"

var ws = undefined;

var msg_ul = document.getElementById('messages')
var check_input = document.getElementById('check_input')
var send_input = document.getElementById('send_input')
var check_img = document.getElementById('checkimg')

function add_msg(msg) {
	var p = document.createElement('p')

	p.innerText = msg

	msg_ul.appendChild(p)
}

function connect_ws() {
	if (ws == undefined) {
		ws = new WebSocket(const_ws_url)
		add_msg('ID : Message')
	}

	ws.onmessage = function(e) {
		let data = JSON.parse(e.data)

		add_msg(data.from_id + ' : ' + data.content)
	}

	ws.onclose = function() {
		ws = undefined
	}
	ws.onerror = function() {
		ws = undefined
	}
}

function send_msg() {
	if (send_input.value.length > 1) {
		var xhr = new XMLHttpRequest()
		xhr.open("POST", const_send_url, true)

		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = function() {
			if (this.readyState == XMLHttpRequest.DONE) {
				if (this.status != 200) {
					alert(this.status + " : " + this.responseText)
				}
			}
		}

		xhr.send(JSON.stringify({
			captcha_result: check_input.value,
			content: send_input.value.substr(0, 256) /* .substr(0, 256) is also on backend. */
		}))

		send_input.value = ''
	}
}

send_input.addEventListener('keyup', function(event) {
	if (event.keyCode === 13) {
		event.preventDefault();
		send_msg()
	}
})

connect_ws()
check_img.src = "/api/captcha"
