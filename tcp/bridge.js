const express = require('express')
const http = require('http')
const path = require('path')
const WebSocket = require('ws')
const net = require('net')

const WS_PORT = 3001 //(bridge)
const TCP_PORT = 5001 

const app = express()

app.use(express.static(path.join(__dirname, 'public')))

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

wss.on('connection', ws => {
	console.log('Новое WebSocket-соединение установлено.')

	// При подключении для этого WebSocket создаем новое TCP-соединение к TCP серверу
	const tcpSocket = net.createConnection({ port: TCP_PORT }, () => {
		console.log('Прокси: подключен к TCP серверу на порту', TCP_PORT)
	})

	// Пересылаем сообщения, полученные по WebSocket, в TCP-соединение
	ws.on('message', message => {
		console.log('Прокси получил сообщение от браузера:', message)
		tcpSocket.write(message + '\n')
	})
	tcpSocket.on('data', data => {
		data
			.toString()
			.split('\n')
			.forEach(line => {
				if (line.trim() !== '') {
					console.log('Прокси получил от TCP сервера:', line)
					ws.send(line)
				}
			})
	})
	ws.on('close', () => {
		console.log('WebSocket соединение закрыто.')
		tcpSocket.end()
	})

	ws.on('error', err => {
		console.error('Ошибка WebSocket:', err.message)
	})

	tcpSocket.on('error', err => {
		console.error('Ошибка TCP в прокси:', err.message)
	})
})
server.listen(WS_PORT, () => {
	console.log(`Прокси-сервер (Bridge) запущен на http://localhost:${WS_PORT}`)
})
