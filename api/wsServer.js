const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 4001 }, () => {
	console.log('WebSocket сервер запущен на http://localhost:4001')
})
wss.on('connection', ws => {
	console.log('Новое соединение')

	ws.on('message', message => {
		console.log('Получено сообщение: ', message);
    const lowerMessage = message.toString().toLowerCase();

    if (lowerMessage.includes('привет') ) {
      ws.send('Здорова работяга');
    } 
		// Транслируем полученное сообщение всем подключенным клиентам
		wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		})
	})

	ws.on('close', () => {
		console.log('Соединение закрыто -_-')
	})
})
