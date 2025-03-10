const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const WebSocket = require('ws')
const http = require('http')
const { ApolloServer, gql } = require('apollo-server-express')

const app = express();

const PORT = process.env.PORT || 4000
const cors = require('cors')


app.use(cors())
app.use(express.static(path.join(__dirname, 'public'))) // Добавляем статические файлы

app.use(bodyParser.json())

let products = [
	{
		id: 1,
		name: 'Часы',
		price: 10000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Электроника'],
	},
	{
		id: 2,
		name: 'Носки',
		price: 200,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Одежда'],
	},
	{
		id: 3,
		name: 'Xiomi Redmi 9 Pro Max 128GB 6GB RAM Dual SIM Onyx Black (Global Version) (Xiaomi)',
		price: 30000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Электроника'],
	},
	{
		id: 4,
		name: 'Квартира в центре Москвы 170м2 3 комнаты 15 этаж с видом на Кремль и Москва-реку',
		price: 400000000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Недвижка'],
	},
	{
		id: 5,
		name: 'Gucci куртка из кожи с мехом б/у',
		price: 50000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Одежда'],
	},
]

const typeDefs = gql`
	type Product {
		id: ID!
		name: String!
		price: Float!
		description: String
		categories: [String]
	}

	type Query {
		products: [Product]
		product(id: ID!): Product
	}
`

const resolvers = {
	Query: {
		products: () => products,
		product: (_, { id }) => products.find(p => p.id === parseInt(id)),
	},
}
async function startApolloServer() {
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });
}
startApolloServer();

const server = http.createServer(app)

//WebSocket

const wss = new WebSocket.Server({ server })

// Для хранения подключений
let adminSocket = null // Подключение администратора (один админ)
const clients = new Map() // Клиенты (ключ – clientId, значение – ws)

wss.on('connection', ws => {
	console.log('Новое WebSocket-соединение установлено')

	ws.on('message', message => {
		console.log('Сервер получил сообщение:', message)
		try {
			const data = JSON.parse(message)
			if (data.type === 'identify') {
				if (data.role === 'admin') {
					adminSocket = ws
					ws.role = 'admin'
					console.log('Подключился админ')
				} else if (data.role === 'client') {
					ws.role = 'client'
					ws.id = data.id || Date.now().toString()
					clients.set(ws.id, ws)
					console.log(`Подключился клиент с id: ${ws.id}`)
				}
				return 
			}
			if (ws.role === 'client') {
				console.log(`Клиент отправил сообщение: ${data.message}`);
				if (adminSocket && adminSocket.readyState === WebSocket.OPEN) {
					const payload = {
					from: 'client',
					clientId: ws.id,
					message: data.message
					};
					adminSocket.send(JSON.stringify(payload));
					console.log('Переслано администратору:', payload);
				}
				}
			if (ws.role === 'admin') {
				if (data.targetId && data.message) {
					const targetSocket = clients.get(data.targetId)
					if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
						const payload = {
							from: 'admin',
							message: data.message,
						}
						targetSocket.send(JSON.stringify(payload))
						console.log(
							`Админ отправил сообщение клиенту ${data.targetId}:`,
							payload
						)
					} else {
						console.log(`Клиент с id ${data.targetId} не найден или недоступен`)
					}
				}
			}
		} catch (e) {
			console.error('Ошибка обработки сообщения:', e)
		}
	})

	ws.on('close', () => {
		if (ws.role === 'admin') {
			adminSocket = null
			console.log('Админ отключился')
		} else if (ws.role === 'client') {
			clients.delete(ws.id)
			console.log(`Клиент с id ${ws.id} отключился`)
		}
	})
})
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Admin Panel API',
      version: '1.0.0',
      description: 'API для управления товарами (REST)',
    },
    servers: [
      {
        url: 'http://localhost:4000', 
	  },
    ],
  },
  apis: [path.join(__dirname, 'admin-api.yaml')], 
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
server.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
	console.log(`GraphQL доступен по http://localhost:${PORT}/graphql`)
})