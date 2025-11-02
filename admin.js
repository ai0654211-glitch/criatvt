// كلمة المرور - غيرها لأي كلمة تريدها
const ADMIN_PASSWORD = "admin123";

// التحقق من تسجيل الدخول
function checkAuth() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// تسجيل الدخول
function login() {
    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadProjects(); // تحميل البيانات بعد الدخول
        loadMessages(); // تحميل الرسائل بعد الدخول
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('adminLoggedIn');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// تبديل خيارات التصنيف الفرعي
function toggleSubCategory() {
    const category = document.getElementById('category').value;
    const subCategoryGroup = document.getElementById('subCategoryGroup');

    if (category === 'electronic-invitations') {
        subCategoryGroup.style.display = 'block';
        document.getElementById('subCategory').required = true;
    } else {
        subCategoryGroup.style.display = 'none';
        document.getElementById('subCategory').required = false;
        document.getElementById('subCategory').value = 'all';
    }
}

// التحقق من المصادقة عند تحميل الصفحة
if (!checkAuth()) {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
} else {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadProjects(); // تحميل البيانات إذا كان مسجل دخول
    loadMessages(); // تحميل الرسائل إذا كان مسجل دخول
}

// إدارة التبويبات
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // إزالة النشاط من جميع الأزرار والمحتويات
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // إضافة النشاط للعناصر المحددة
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');

        // تحميل المحتوى عند التبديل
        if (button.dataset.tab === 'projects') {
            loadProjects();
        } else if (button.dataset.tab === 'messages') {
            loadMessages();
        }
    });
});

// إضافة مشروع جديد
document.getElementById('project-form').addEventListener('submit', async(e) => {
    e.preventDefault();

    const categoryEl = document.getElementById('category');
    const category = categoryEl ? categoryEl.value : '';
    const subEl = document.getElementById('subCategory');
    // افحص وجود الحقل بأمان؛ إذا لم يكن موجودًا أو فارغًا، ضع القيمة الافتراضية 'all'
    let subCategory = (subEl && subEl.value) ? subEl.value : 'all';

    console.log('📝 البيانات المختارة:', { category, subCategory });

    // إذا لم يكن تصنيف الدعوات الإلكترونية، اجعل subCategory = 'all'
    if (category !== 'electronic-invitations') {
        subCategory = 'all';
    }

    const projectData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: category,
        subCategory: subCategory,
        imageUrl: document.getElementById('imageUrl').value.trim(),
        projectUrl: document.getElementById('projectUrl').value.trim() || ''
    };

    console.log('📤 بيانات المشروع المرسلة:', projectData);

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ تم إضافة المشروع بنجاح!');
            document.getElementById('project-form').reset();
            document.getElementById('subCategoryGroup').style.display = 'none';
            document.getElementById('subCategory').required = false;
            loadProjects();
        } else {
            alert('❌ حدث خطأ أثناء إضافة المشروع: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
});

// تحميل وعرض المشاريع
async function loadProjects() {
    try {
        const projectsContainer = document.getElementById('projects-container');
        projectsContainer.innerHTML = '<div class="loading">جاري تحميل المشاريع...</div>';

        const response = await fetch('/api/projects');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'فشل في جلب المشاريع');
        }

        let projects = [];
        if (result.success && result.data) {
            projects = result.data;
        } else if (Array.isArray(result)) {
            projects = result;
        }

        const container = document.getElementById('projects-container');
        container.innerHTML = '';

        // تحديث العداد
        document.getElementById('projects-count').textContent = projects.length;

        if (projects.length === 0) {
            container.innerHTML = '<p>لا توجد مشاريع حالياً</p>';
            return;
        }

        projects.forEach(project => {
                    const projectCard = document.createElement('div');
                    projectCard.className = 'project-card';

                    const categoryNames = {
                        'graphic-design': 'جرافيك ديزاين',
                        'electronic-invitations': 'دعوات إلكترونية',
                        'web-development': 'ويب ديفلوبمنت'
                    };

                    const subCategoryNames = {
                        'all': 'جميع الأعمال',
                        'wedding': 'دعوات زواج',
                        'baby': 'بشارة مولود',
                        'engagement': 'عقد قران',
                        'congratulations': 'تهنئة',
                        'reception': 'استقبال',
                        'graduation': 'تخرج',
                        'promotion': 'ترقية',
                        'queen-party': 'حفل ملكة'
                    };

                    // تسجيل بيانات المشروع للتصحيح
                    console.log('📊 مشروع:', project.title, 'subCategory:', project.subCategory);

                    projectCard.innerHTML = `
                <h4>${project.title} 
                    <span class="category-badge">${categoryNames[project.category]}</span>
                </h4>
                <p class="project-meta">
                    ${new Date(project.createdAt).toLocaleDateString('ar-EG')}
                    ${project.subCategory && project.subCategory !== 'all' ? 
                        `<span class="subcategory-badge">${subCategoryNames[project.subCategory]}</span>` : 
                        ''}
                </p>
                <p>${project.description}</p>
                <div class="project-info">
                    <strong>التصنيف الفرعي في DB:</strong> ${project.subCategory || 'غير محدد'}
                </div>
                <div class="actions">
                    <button class="delete" onclick="deleteProject('${project._id}')">حذف</button>
                </div>
            `;
            
            container.appendChild(projectCard);
        });
        
        console.log(`✅ تم تحميل ${projects.length} مشروع`);
    } catch (error) {
        console.error('Error loading projects:', error);
        const container = document.getElementById('projects-container');
        container.innerHTML = `<div class="error">خطأ في تحميل المشاريع: ${error.message}</div>`;
    }
}

// حذف مشروع
async function deleteProject(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    
    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ تم حذف المشروع بنجاح');
            loadProjects();
        } else {
            alert('❌ حدث خطأ أثناء حذف المشروع: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// تحميل وعرض الرسائل
async function loadMessages() {
    try {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '<div class="loading">جاري تحميل الرسائل...</div>';
        
        const response = await fetch('/api/messages');
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'فشل في جلب الرسائل');
        }
        
        let messages = [];
        if (result.success && result.data) {
            messages = result.data;
        } else if (Array.isArray(result)) {
            messages = result;
        }
        
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        
        // تحديث العدادات
        document.getElementById('messages-count').textContent = messages.length;
        document.getElementById('messages-tab-count').textContent = messages.length;
        
        if (messages.length === 0) {
            container.innerHTML = '<p>لا توجد رسائل حالياً</p>';
            return;
        }
        
        messages.forEach(message => {
            const messageCard = document.createElement('div');
            messageCard.className = 'message-card';
            
            messageCard.innerHTML = `
                <h4>${message.name} 
                    <span class="read-status ${message.read ? 'read' : ''}"></span>
                </h4>
                <p class="message-meta">
                    ${message.email} - ${new Date(message.createdAt).toLocaleDateString('ar-EG')}
                </p>
                <p>${message.message}</p>
                <div class="actions">
                    ${!message.read ? `<button onclick="markAsRead('${message._id}')">تحديد كمقروء</button>` : ''}
                    <button class="delete" onclick="deleteMessage('${message._id}')">حذف</button>
                </div>
            `;
            
            container.appendChild(messageCard);
        });
        
        console.log(`✅ تم تحميل ${messages.length} رسالة`);
    } catch (error) {
        console.error('Error loading messages:', error);
        const container = document.getElementById('messages-container');
        container.innerHTML = `<div class="error">خطأ في تحميل الرسائل: ${error.message}</div>`;
    }
}

// تحديد الرسالة كمقروءة
async function markAsRead(id) {
    try {
        const response = await fetch(`/api/messages/${id}/read`, {
            method: 'PATCH'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadMessages();
        } else {
            alert('❌ حدث خطأ في تحديث الرسالة: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// حذف رسالة
async function deleteMessage(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ تم حذف الرسالة بنجاح');
            loadMessages();
        } else {
            alert('❌ حدث خطأ أثناء حذف الرسالة: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// أداة تحويل المشاريع القديمة
async function convertOldProjects() {
    if (!confirm('هل تريد تحويل المشاريع القديمة من multimedia إلى electronic-invitations؟')) return;
    
    try {
        const response = await fetch('/api/projects/convert-multimedia', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.message}`);
            loadProjects();
        } else {
            alert('❌ حدث خطأ في التحويل: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// تحديث التصنيفات الفرعية للمشاريع القديمة
async function updateSubCategories() {
    if (!confirm('هل تريد تحديث التصنيفات الفرعية للمشاريع القديمة بناءً على محتوى الوصف؟')) return;
    
    try {
        const response = await fetch('/api/projects/update-subcategories', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.message}`);
            loadProjects();
        } else {
            alert('❌ حدث خطأ في التحديث: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// إصلاح جميع المشاريع - تعيين subCategory للمشاريع المفقودة
async function fixAllProjects() {
    if (!confirm('هل تريد إصلاح جميع المشاريع وتعيين التصنيفات الفرعية المفقودة؟')) return;
    
    try {
        // أولاً: تحويل المشاريع القديمة
        const convertResponse = await fetch('/api/projects/convert-multimedia', {
            method: 'POST'
        });
        const convertResult = await convertResponse.json();
        
        // ثانياً: تحديث التصنيفات الفرعية
        const updateResponse = await fetch('/api/projects/update-subcategories', {
            method: 'POST'
        });
        const updateResult = await updateResponse.json();
        
        alert(`✅ تم الإصلاح بنجاح!\n- ${convertResult.message}\n- ${updateResult.message}`);
        loadProjects();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// إصلاح التصنيفات الفرعية المفقودة (نداء إلى route الطارئ في server.js)
async function fixMissingSubCategories() {
    if (!confirm('هل تريد إصلاح التصنيفات الفرعية المفقودة في قاعدة البيانات الآن؟')) return;

    try {
        const response = await fetch('/api/projects/fix-missing-subcategories', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ ${result.message}\n
تفاصيل:\n- إجمالي المشاريع: ${result.stats.totalProjects}\n- تم إصلاح المفقود: ${result.stats.fixedMissing}\n- تم تحديث من الوصف: ${result.stats.updatedFromDescription}`);
            loadProjects();
        } else {
            alert('❌ حدث خطأ أثناء الإصلاح: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ حدث خطأ في الاتصال بالخادم');
    }
}

// إضافة CSS للأزرار والأقسام الجديدة
function addAdminStyles() {
    if (document.getElementById('admin-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
        .subcategory-badge {
            background: #9b59b6;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 10px;
        }
        
        .tools-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        
        .tools-section h3 {
            margin-top: 0;
            color: #495057;
        }
        
        .tools-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .tool-btn {
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .tool-btn:hover {
            background: #5a6268;
        }
        
        .tool-btn.warning {
            background: #e74c3c;
        }
        
        .tool-btn.warning:hover {
            background: #c0392b;
        }
        
        #subCategoryGroup {
            display: none;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #dee2e6;
        }
        
        .project-info {
            background: #e9ecef;
            padding: 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 0.9em;
            color: #495057;
        }
    `;
    document.head.appendChild(style);
}

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    addAdminStyles();
    
    // إضافة أزرار الأدوات إذا لم تكن موجودة
    const projectsTab = document.getElementById('projects');
    if (projectsTab && !document.getElementById('toolsSection')) {
        const toolsHtml = `
            <div class="tools-section" id="toolsSection">
                <h3>أدوات الإدارة - إصلاح المشاكل</h3>
                <div class="tools-buttons">
                    <button class="tool-btn" onclick="convertOldProjects()">
                        تحويل مشاريع multimedia
                    </button>
                    <button class="tool-btn" onclick="updateSubCategories()">
                        تحديث التصنيفات الفرعية
                    </button>
                    <button class="tool-btn warning" onclick="fixAllProjects()">
                        إصلاح جميع المشاريع
                    </button>
                    <button class="tool-btn" onclick="fixMissingSubCategories()">
                        إصلاح التصنيفات المفقودة
                    </button>
                </div>
                <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    استخدم هذه الأدوات لإصلاح المشاكل في التصنيفات الفرعية للمشاريع القديمة.
                </p>
            </div>
        `;
        projectsTab.insertAdjacentHTML('beforeend', toolsHtml);
    }
    
    // إضافة حقل التصنيف الفرعي للنموذج إذا لم يكن موجوداً
    const projectForm = document.getElementById('project-form');
    if (projectForm && !document.getElementById('subCategoryGroup')) {
        const subCategoryHtml = `
            <div id="subCategoryGroup" style="display: none;">
                <div class="form-group">
                    <label for="subCategory">نوع الدعوة:</label>
                    <select id="subCategory" class="form-control">
                        <option value="all">جميع الأعمال</option>
                        <option value="wedding">دعوات زواج</option>
                        <option value="baby">بشارة مولود</option>
                        <option value="engagement">عقد قران</option>
                        <option value="congratulations">تهنئة</option>
                        <option value="reception">استقبال</option>
                        <option value="graduation">تخرج</option>
                        <option value="promotion">ترقية</option>
                        <option value="queen-party">حفل ملكة</option>
                    </select>
                    <small style="color: #666;">اختر نوع الدعوة الإلكترونية</small>
                </div>
            </div>
        `;
        
        // إدراج حقل التصنيف الفرعي بعد حقل التصنيف الرئيسي
        const categoryGroup = projectForm.querySelector('#category').closest('.form-group');
        if (categoryGroup) {
            categoryGroup.insertAdjacentHTML('afterend', subCategoryHtml);
        }
        
        // إضافة event listener لحقل التصنيف الرئيسي
        document.getElementById('category').addEventListener('change', toggleSubCategory);
    }
    
    // إضافة console.log للتصحيح
    console.log('🛠️ نظام الأدمن تم تحميله بنجاح مع التصنيفات الفرعية');
});