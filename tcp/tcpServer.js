const net = require('net')

const PORT = 5001 

const clients = new Map()
let adminSocket = null

const server = net.createServer(socket => {
	console.log('Новое TCP-соединение установлено.')

	socket.on('data', data => {
		const msg = data.toString().trim()

		// Если сокет ещё не идентифицирован, ждем идентификационное сообщение
		if (!socket.identified) {
			if (msg.startsWith('IDENTIFY:')) {
				const parts = msg.split(':')
				const role = parts[1]
				socket.role = role
				socket.identified = true
				if (role === 'client') {
					socket.id = parts[2] || Date.now().toString()
					clients.set(socket.id, socket)
					console.log(`Клиент идентифицирован с id: ${socket.id}`)
					socket.write(`Вы идентифицированы как клиент с id: ${socket.id}\n`)
				} else if (role === 'admin') {
					adminSocket = socket
					console.log('Администратор подключился.')
					socket.write('Вы идентифицированы как администратор.\n')
				} else {
					socket.write('Неизвестная роль.\n')
					socket.end()
				}
			} else {
				socket.write('Сначала идентифицируйтесь (формат: IDENTIFY:role[:id])\n')
			}
			return // завершаем обработку до идентификации
		}

		// Если сообщение пришло от клиента, пересылаем его администратору
		if (socket.role === 'client') {
			console.log(`Сообщение от клиента ${socket.id}: ${msg}`)
			if (adminSocket && !adminSocket.destroyed) {
				const payload = {
					from: 'client',
					clientId: socket.id,
					message: msg,
				}
				adminSocket.write(JSON.stringify(payload) + '\n')
				console.log('Сообщение переслано админу:', payload)
			} else {
				socket.write('Администратор не подключен.\n')
			}
		}

		// Если сообщение пришло от администратора
		if (socket.role === 'admin') {
			if (msg.startsWith('TO:')) {
				const firstColon = msg.indexOf(':', 3)
				if (firstColon !== -1) {
					const targetId = msg.substring(3, firstColon)
					const messageToSend = msg.substring(firstColon + 1).trim()
					console.log(
						`Админ отправляет сообщение клиенту ${targetId}: ${messageToSend}`
					)
					const targetSocket = clients.get(targetId)
					if (targetSocket && !targetSocket.destroyed) {
						const payload = {
							from: 'admin',
							message: messageToSend,
						}
						targetSocket.write(JSON.stringify(payload) + '\n')
						console.log(`Сообщение отправлено клиенту ${targetId}.`)
					} else {
						socket.write(`Клиент ${targetId} не найден или отключен.\n`)
					}
				} else {
					socket.write(
						'Неверный формат. Используйте: TO:<clientId>:<message>\n'
					)
				}
			} else {
				socket.write('Сообщения администратора должны начинаться с "TO:"\n')
			}
		}
	})

	socket.on('end', () => {
		console.log(
			`Соединение окончено. Роль: ${socket.role}, id: ${socket.id || 'N/A'}`
		)
		if (socket.role === 'client' && socket.id) {
			clients.delete(socket.id)
		} else if (socket.role === 'admin') {
			adminSocket = null
		}
	})

	socket.on('error', err => {
		console.error('Ошибка сокета:', err.message)
	})
})

server.listen(PORT, () => {
	console.log(`TCP сервер запущен и слушает порт ${PORT}`)
})
