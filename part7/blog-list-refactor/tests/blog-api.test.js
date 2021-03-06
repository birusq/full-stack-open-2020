const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const app = require('../app')
const bcrypt = require('bcrypt')

const api = supertest(app)

describe('when there are two blogs in the db', () => {
	beforeEach(async () => {
		await Blog.deleteMany({})
		await Blog.insertMany(helper.initialBlogs)
	})

	test('blogs are returned as json', async () => {
		await api
			.get('/api/blogs')
			.expect(200)
			.expect('Content-Type', /application\/json/)
	})

	test('right amount of blogs are returned', async () => {
		const response = await api.get('/api/blogs')

		expect(response.body).toHaveLength(helper.initialBlogs.length)
	})

	test('blogs have property id', async () => {
		const blogs = await helper.blogsInDb()
		for (let blog of blogs) {
			expect(blog.id).toBeDefined()
		}
	})
})

const initialUsername = 'test-user'
const initialName = 'test-name'
const initialPassword = 'test-password'
const initialLoginInfo = { username: initialUsername, password: initialPassword }

describe('when there is one user in the db', () => {
	beforeEach(async () => {
		await User.deleteMany({})

		const passwordHash = await bcrypt.hash(initialPassword, 1)
		const user = new User({ username: initialUsername, name: initialName, passwordHash })

		await user.save()
	})

	test('users can be added', async () => {
		const oldUsers = await helper.usersInDb()

		const user = {
			username: 'added',
			name: 'added',
			password: 'added'
		}

		await api.post('/api/users').send(user)
			.expect(201).expect('Content-Type', /application\/json/)

		const newUsers = await helper.usersInDb()

		expect(newUsers).toHaveLength(oldUsers.length + 1)
		expect(newUsers.map(blog => blog.username)).toContain('added')
	})

	test('malformed users cant be added', async () => {
		const oldUsers = await helper.usersInDb()

		const noUsername = { name: 'cantadd', password: 'cantadd' }
		await api.post('/api/users').send(noUsername).expect(400)

		const noName = { username: 'cantadd', password: 'cantadd' }
		await api.post('/api/users').send(noName).expect(400)

		const noPassword = { username: 'cantadd', name: 'cantadd' }
		await api.post('/api/users').send(noPassword).expect(400)

		const tooShortUsername = { username: 'c', name: 'cantadd', password: 'cantadd' }
		await api.post('/api/users').send(tooShortUsername).expect(400)

		const tooShortPassword = { username: 'cantadd', name: 'cantadd', password: 'c' }
		await api.post('/api/users').send(tooShortPassword).expect(400)

		const duplicateUsername = { username: 'added', name: 'cantadd', password: 'c' }
		await api.post('/api/users').send(duplicateUsername).expect(400)

		const newUsers = await helper.usersInDb()

		expect(newUsers).toHaveLength(oldUsers.length)
	})

	describe('when adding a blog', () => {
		test('a blog can be added with correct user token', async () => {
			const loginResponse = await api.post('/api/login').send(initialLoginInfo)

			const blog = {
				title: 'added',
				author: 'added',
				url: 'added',
				likes: 10,
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${loginResponse.body.token}`)
				.send(blog)
				.expect(201)

			const newBlogs = await helper.blogsInDb()

			expect(newBlogs).toHaveLength(helper.initialBlogs.length + 1)
			expect(newBlogs.map(blog => blog.title)).toContain('added')
		})

		test('likes is set to zero if it is emitted', async () => {
			const loginResponse = await api.post('/api/login').send(initialLoginInfo)

			const blog = {
				title: 'added',
				author: 'added',
				url: 'added'
			}

			const response = await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${loginResponse.body.token}`)
				.send(blog)
				.expect(201)

			const newBlog = response.body

			expect(newBlog.likes).toBe(0)
		})

		test('responds with 400 if title or url are not set', async () => {
			const loginResponse = await api.post('/api/login').send(initialLoginInfo)

			// Silence errors for this test, because they are expected
			const consoleError = console.error
			console.error = jest.fn()

			let blog = {
				title: 'added',
				url: 'added',
				likes: 10
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${loginResponse.body.token}`)
				.send(blog)
				.expect(400)

			blog = {
				author: 'added',
				url: 'added',
				likes: 10
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${loginResponse.body.token}`)
				.send(blog)
				.expect(400)

			blog = {
				url: 'added',
				likes: 10
			}

			await api
				.post('/api/blogs')
				.set('Authorization', `Bearer ${loginResponse.body.token}`)
				.send(blog)
				.expect(400)

			console.error = consoleError
		})

		test('responds with 401 if we don\'t supply a token', async () => {
			// Silence errors for this test, because they are expected
			const consoleError = console.error
			console.error = jest.fn()

			const blog = {
				title: 'added',
				author: 'added',
				url: 'added',
				likes: 10,
			}

			await api
				.post('/api/blogs')
				.send(blog)
				.expect(401)

			console.error = consoleError
		})
	})
})



afterAll(() => {
	mongoose.connection.close()
})