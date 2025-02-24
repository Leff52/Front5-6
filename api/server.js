const express = require('express');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = process.env.PORT || 3001
const cors = require('cors')


app.use(cors())


app.use(bodyParser.json())

let products = [
	{
		id: 1,
		name: 'Товар 1',
		price: 25000,
		description: 'Описание товара 1',
		categories: ['Телфоны', 'Смартфоны'],
	},
	{
		id: 2,
		name: 'Товар 2',
		price: 2250,
		description: 'Описание товара 2',
		categories: ['Одежда'],
	},
	{
		id: 3,
		name: 'Товар 3',
		price: 3000,
		description: 'Описание товара 3',
		categories: ['Стройматериалы'],
	},
	{
		id: 4,
		name: 'Товар 4',
		price: 2500000,
		description: 'Описание товара 4',
		categories: ['Недвижка'],
	},
	{
		id: 5,
		name: 'Товар 5',
		price: 5000,
		description: 'Описание товара 5',
		categories: ['Видеокарты'],
	},
]
// Поиск товаров (по параметрам)
app.get('/products', (req, res) => {
	const { category, id } = req.query
	let filtered = products
	if (id) {
		filtered = filtered.filter(p => p.id === parseInt(id))
	}
	if (category) {
		filtered = filtered.filter(p => p.categories.includes(category))
	}
	res.json(filtered)
})
// Добавление нового товара
app.post('/products', (req, res) => {
	const { name, price, description, categories } = req.body
	const newProduct = {
		id: products.length + 1,
		name,
		price,
		description,
		categories,
	}
	products.push(newProduct)
	res.status(201).json(newProduct)
})
// Получение информации о товаре (по id)
app.get('/products/:id', (req, res) => {
	const product = products.find(p => p.id === parseInt(req.params.id))
	if (product) {
		res.json(product)
	} else {
		res.status(404).json({ message: 'Товар не найден' })
	}
})
// Обновление товара (по id)
app.put('/products/:id', (req, res) => {
	const product = products.find(p => p.id === parseInt(req.params.id))
	if (product) {
		const { name, price, description, categories } = req.body
		product.name = name || product.name
		product.price = price || product.price
		product.description = description || product.description
		product.categories = categories || product.categories
		res.json(product)
	} else {
		res.status(404).json({ message: 'Товар не найден' })
	}
})

// Удаление товара (по id)
app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id !== parseInt(req.params.id));
  res.status(204).send();
});
// Инициализация Swagger
const swaggerOptions = {
	swaggerDefinition: {
		openapi: '3.0.0',
		info: {
			title: 'Admin Panel API',
			version: '1.0.0',
			description: 'API для управления товарами интернет-магазина',
		},
		servers: [
			{
				url: 'http://localhost:3001',
			},
		],
	},
	apis: ['./server.js'], // Путь к файлам с описанием роутов
}
// Инициализация SwaggerUI
const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.get('/', (req, res) => {
	res.send('Hello! Это API сервер. Перейдите на /products или /api-docs')
})

// Запуск сервера
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
})