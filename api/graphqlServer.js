const { ApolloServer, gql } = require('apollo-server-express')
const express = require('express')
let products = [
	{
		id: 1,
		name: 'Товар 1',
		price: 10000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Электроника'],
	},
	{
		id: 2,
		name: 'Товар 2',
		price: 200,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Одежда'],
	},
	{
		id: 3,
		name: 'Товар 3',
		price: 30000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Электроника'],
	},
	{
		id: 4,
		name: 'Товар 4',
		price: 400000000,
		description:
			'Далеко-далеко за словесными горами, в стране гласных и согласных живут рыбные тексты. Предупредила предложения все заголовок лучше парадигматическая жизни страну языком залетают.',
		categories: ['Недвижка'],
	},
	{
		id: 5,
		name: 'Товар 5',
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

const server = new ApolloServer({ typeDefs, resolvers })

const app = express()
async function startServer() {
	await server.start()
	server.applyMiddleware({ app, path: '/graphql' })

	const PORT = process.env.PORT || 8800 // Порт на котором будет работать сервер
	app.listen(PORT, () => {
		console.log(
			`GraphQL сервер запущен на http://localhost:${PORT}${server.graphqlPath}`
		)
	})
}
startServer()
