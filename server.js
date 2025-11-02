const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.murmx1j.mongodb.net/creativitywebsite?retryWrites=true&w=majority';

const connectDB = async() => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB successfully!');
        console.log('📊 Database: creativitywebsite');
        return true;
    } catch (error) {
        console.log('❌ MongoDB Connection Failed:', error.message);
        return false;
    }
};

// Project Schema - محدث مع subCategory
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
        default: '',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Message Schema
const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

// Models
const Project = mongoose.model('Project', projectSchema);
const Message = mongoose.model('Message', messageSchema);

// 📁 Projects Routes

// Get all projects
app.get('/api/projects', async(req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: err.message
        });
    }
});

// Get projects by category
app.get('/api/projects/category/:category', async(req, res) => {
    try {
        let category = req.params.category;

        if (category === 'invitations' || category === 'electronic-invitations') {
            category = 'electronic-invitations';
        }

        console.log(`🔍 جاري البحث عن مشاريع في: ${category}`);

        const projects = await Project.find({
            category: category
        }).sort({ createdAt: -1 });

        console.log(`✅ تم العثور على ${projects.length} مشروع في ${category}`);

        res.json(projects);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: err.message
        });
    }
});

// Get single project
app.get('/api/projects/:id', async(req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: err.message
        });
    }
});

// Add new project - مع دعم subCategory
app.post('/api/projects', async(req, res) => {
    try {
        console.log('🆕 طلب إضافة مشروع جديد:', req.body);

        // التحقق من البيانات المطلوبة
        if (!req.body.title || !req.body.description || !req.body.category || !req.body.imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة (العنوان، الوصف، التصنيف، رابط الصورة)'
            });
        }

        // ⚠️ الإصلاح المهم: التأكد من وجود subCategory
        let subCategory = req.body.subCategory || 'all';

        // إذا لم يكن تصنيف الدعوات الإلكترونية، اجعل subCategory = 'all'
        if (req.body.category !== 'electronic-invitations') {
            subCategory = 'all';
        }

        console.log('🎯 التصنيفات النهائية:', {
            category: req.body.category,
            subCategory: subCategory,
            receivedSubCategory: req.body.subCategory
        });

        const project = new Project({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            subCategory: subCategory,
            imageUrl: req.body.imageUrl,
            projectUrl: req.body.projectUrl || ''
        });

        const newProject = await project.save();

        console.log('✅ تم إضافة المشروع بنجاح:', {
            id: newProject._id,
            title: newProject.title,
            category: newProject.category,
            subCategory: newProject.subCategory
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المشروع بنجاح',
            data: newProject
        });

    } catch (err) {
        console.error('❌ خطأ في إضافة المشروع:', err.message);

        res.status(400).json({
            success: false,
            message: 'فشل في إضافة المشروع: ' + err.message,
            error: err.message
        });
    }
});

// Update project
app.put('/api/projects/:id', async(req, res) => {
    try {
        let subCategory = req.body.subCategory || 'all';
        if (req.body.category !== 'electronic-invitations') {
            subCategory = 'all';
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id, {
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                subCategory: subCategory,
                imageUrl: req.body.imageUrl,
                projectUrl: req.body.projectUrl
            }, { new: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to update project',
            error: err.message
        });
    }
});

// Delete project
app.delete('/api/projects/:id', async(req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete project',
            error: err.message
        });
    }
});

// 📧 Messages Routes
app.get('/api/messages', async(req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: messages
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: err.message
        });
    }
});

app.post('/api/messages', async(req, res) => {
    try {
        const message = new Message({
            name: req.body.name,
            email: req.body.email,
            message: req.body.message
        });

        const newMessage = await message.save();
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to send message',
            error: err.message
        });
    }
});

app.patch('/api/messages/:id/read', async(req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id, { read: true }, { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message marked as read',
            data: message
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to update message',
            error: err.message
        });
    }
});

app.delete('/api/messages/:id', async(req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: err.message
        });
    }
});

// 🎛️ Admin Panel Routes
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// Health check
app.get('/api/health', async(req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        databaseName: 'creativitywebsite',
        uptime: process.uptime()
    });
});

// Debug route لفحص المشاريع
app.get('/api/debug/projects', async(req, res) => {
    try {
        const projects = await Project.find();
        res.json({
            total: projects.length,
            byCategory: {
                'graphic-design': projects.filter(p => p.category === 'graphic-design').length,
                'electronic-invitations': projects.filter(p => p.category === 'electronic-invitations').length,
                'web-development': projects.filter(p => p.category === 'web-development').length
            },
            bySubCategory: {
                'all': projects.filter(p => p.subCategory === 'all').length,
                'wedding': projects.filter(p => p.subCategory === 'wedding').length,
                'baby': projects.filter(p => p.subCategory === 'baby').length,
                'engagement': projects.filter(p => p.subCategory === 'engagement').length,
                'congratulations': projects.filter(p => p.subCategory === 'congratulations').length,
                'reception': projects.filter(p => p.subCategory === 'reception').length,
                'graduation': projects.filter(p => p.subCategory === 'graduation').length,
                'promotion': projects.filter(p => p.subCategory === 'promotion').length,
                'queen-party': projects.filter(p => p.subCategory === 'queen-party').length
            },
            projects: projects
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// route لتحويل المشاريع القديمة
app.post('/api/projects/convert-multimedia', async(req, res) => {
    try {
        console.log('🔄 جاري تحويل مشاريع multimedia إلى electronic-invitations...');

        const result = await Project.updateMany({ category: 'multimedia' }, { $set: { category: 'electronic-invitations', subCategory: 'all' } });

        console.log('✅ تم التحويل:', result.modifiedCount, 'مشروع');

        res.json({
            success: true,
            message: `تم تحويل ${result.modifiedCount} مشروع من multimedia إلى electronic-invitations`,
            converted: result.modifiedCount
        });

    } catch (err) {
        console.error('❌ خطأ في التحويل:', err);
        res.status(500).json({
            success: false,
            message: 'فشل في التحويل',
            error: err.message
        });
    }
});

// route لتعيين subCategory للمشاريع القديمة
app.post('/api/projects/update-subcategories', async(req, res) => {
    try {
        console.log('🔄 جاري تحديث التصنيفات الفرعية للمشاريع القديمة...');

        const updates = [
            { keywords: ['زفاف', 'زواج', 'عرس', 'wedding'], subCategory: 'wedding' },
            { keywords: ['مولود', 'طفل', 'بيبي', 'baby', 'طفلة'], subCategory: 'baby' },
            { keywords: ['قران', 'خطوبة', 'engagement'], subCategory: 'engagement' },
            { keywords: ['تهنئة', 'مبروك', 'congratulations'], subCategory: 'congratulations' },
            { keywords: ['تخرج', 'graduation'], subCategory: 'graduation' },
            { keywords: ['ترقية', 'promotion'], subCategory: 'promotion' },
            { keywords: ['ملكة', 'حفل', 'queen'], subCategory: 'queen-party' },
            { keywords: ['استقبال', 'reception'], subCategory: 'reception' }
        ];

        let updatedCount = 0;

        for (const update of updates) {
            const regex = new RegExp(update.keywords.join('|'), 'i');
            const result = await Project.updateMany({
                category: 'electronic-invitations',
                description: { $regex: regex }
            }, { $set: { subCategory: update.subCategory } });
            updatedCount += result.modifiedCount;
            console.log(`✅ تم تحديث ${result.modifiedCount} مشروع لـ ${update.subCategory}`);
        }

        res.json({
            success: true,
            message: `تم تحديث ${updatedCount} مشروع بالتصنيفات الفرعية`,
            updated: updatedCount
        });

    } catch (err) {
        console.error('❌ خطأ في تحديث التصنيفات الفرعية:', err);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث التصنيفات الفرعية',
            error: err.message
        });
    }
});

// route طارئ لإصلاح جميع المشاريع المفقودة subCategory
app.post('/api/projects/fix-missing-subcategories', async(req, res) => {
    try {
        console.log('🚨 بدء إصلاح طارئ لجميع المشاريع...');

        // 1. إضافة subCategory للمشاريع المفقودة
        const missingSubCategory = await Project.updateMany({
            $or: [
                { subCategory: { $exists: false } },
                { subCategory: null },
                { subCategory: '' }
            ]
        }, { $set: { subCategory: 'all' } });

        console.log('✅ تم إصلاح المشاريع المفقودة:', missingSubCategory.modifiedCount);

        // 2. تحديث التصنيفات الفرعية بناءً على الوصف
        const updates = [
            { keywords: ['زفاف', 'زواج', 'عرس', 'wedding'], subCategory: 'wedding' },
            { keywords: ['مولود', 'طفل', 'بيبي', 'baby', 'طفلة'], subCategory: 'baby' },
            { keywords: ['قران', 'خطوبة', 'engagement'], subCategory: 'engagement' },
            { keywords: ['تهنئة', 'مبروك', 'congratulations'], subCategory: 'congratulations' },
            { keywords: ['تخرج', 'graduation'], subCategory: 'graduation' },
            { keywords: ['ترقية', 'promotion'], subCategory: 'promotion' },
            { keywords: ['ملكة', 'حفل', 'queen'], subCategory: 'queen-party' },
            { keywords: ['استقبال', 'reception'], subCategory: 'reception' }
        ];

        let updatedCount = 0;
        for (const update of updates) {
            const regex = new RegExp(update.keywords.join('|'), 'i');
            const result = await Project.updateMany({
                description: { $regex: regex },
                subCategory: 'all'
            }, { $set: { subCategory: update.subCategory } });
            updatedCount += result.modifiedCount;
            console.log(`✅ تم تحديث ${result.modifiedCount} مشروع لـ ${update.subCategory}`);
        }

        // 3. جلب الإحصائيات النهائية
        const projects = await Project.find();
        const subCategoryStats = {};
        projects.forEach(project => {
            const subCat = project.subCategory || 'غير محدد';
            subCategoryStats[subCat] = (subCategoryStats[subCat] || 0) + 1;
        });

        res.json({
            success: true,
            message: `تم الإصلاح الطارئ بنجاح!`,
            stats: {
                totalProjects: projects.length,
                fixedMissing: missingSubCategory.modifiedCount,
                updatedFromDescription: updatedCount,
                subCategoryStats: subCategoryStats
            }
        });

    } catch (err) {
        console.error('❌ خطأ في الإصلاح الطارئ:', err);
        res.status(500).json({
            success: false,
            message: 'فشل في الإصلاح الطارئ',
            error: err.message
        });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Initialize server
const startServer = async() => {
    const dbConnected = await connectDB();

    app.listen(PORT, () => {
        console.log('🚀 ===== Creativity Website Server Started =====');
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌐 Frontend: http://localhost:${PORT}`);
        console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`📊 API: http://localhost:${PORT}/api`);
        console.log(`💾 Database: ${dbConnected ? '✅ creativitywebsite' : '❌ MongoDB Not Available'}`);
        console.log('===============================================');
    });
};

startServer();