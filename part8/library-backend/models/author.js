const mongoose = require('mongoose')

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		minlength: 4
	},
	born: {
		type: Number,
	}
})

schema.options.toJSON = {
	transform: function (doc, ret, options) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	}
};

module.exports = mongoose.model('Author', schema)
