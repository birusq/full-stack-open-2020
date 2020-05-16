const blogsRouter = require('express').Router()
const Blog = require('../models/blog')


blogsRouter.get('/', (request, response, next) => {
	Blog
		.find({})
		.then(blogs => {
			response.json(blogs.map(blog => blog.toJSON()))
		})
		.catch(err => {
			next(err)
		})
})

blogsRouter.post('/', (request, response, next) => {
	const blog = new Blog(request.body)

	blog
		.save()
		.then(blog => {
			response.status(201).json(blog.toJSON())
		})
		.catch(err => {
			next(err)
		})
})

module.exports = blogsRouter
