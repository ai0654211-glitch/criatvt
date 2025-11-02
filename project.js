const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['graphic-design', 'electronic-invitations', 'web-development']
    },
    subCategory: {
        type: String,
        default: 'all',
        enum: ['all', 'wedding', 'baby', 'engagement', 'congratulations', 'reception', 'graduation', 'promotion', 'queen-party']
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    projectUrl: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// تأكد من أن الموديل مسجل بشكل صحيح
module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);