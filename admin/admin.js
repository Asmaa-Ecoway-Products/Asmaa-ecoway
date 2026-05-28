// admin.js - لوحة تحكم Asmaa Ecoway

const SUPABASE_URL = 'https://oybviqlrlsprjrhjftvs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YnZpcWxybHNwcmpyaGpmdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODgyMzAsImV4cCI6MjA5MjU2NDIzMH0.rPDNAZe9DNTi3eQd3L_lnLrEgQ8g8uwr6GAWhnydVIc';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProducts = [];

// ==================== Toast Notifications ====================
const AdminToast = {
    show(message, type = 'success') {
        let container = document.getElementById('admin-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-toast-container';
            container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        const bg = type === 'success' ? '#2d5a27' : (type === 'error' ? '#dc2626' : '#ea580c');
        toast.style.cssText = `background:${bg};color:white;padding:12px 24px;border-radius:12px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.2);animation:toastIn 0.3s cubic-bezier(0.25,0.8,0.25,1);`;
        toast.innerHTML = message;
        
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s cubic-bezier(0.25,0.8,0.25,1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

if (!document.getElementById('toast-keyframes')) {
    const s = document.createElement('style');
    s.id = 'toast-keyframes';
    s.innerHTML = `@keyframes toastIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}} @keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}`;
    document.head.appendChild(s);
}

// ==================== Loader ====================
function showLoader(text = 'جاري التحميل...') {
    document.getElementById('global-loader').classList.remove('hidden');
    document.getElementById('loader-text').innerText = text;
}
function hideLoader() {
    document.getElementById('global-loader').classList.add('hidden');
}

// ==================== Auth ====================
window.loginUser = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    showLoader('جاري تسجيل الدخول...');
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        checkAuthStatus();
        AdminToast.show('تم تسجيل الدخول بنجاح');
    } catch (error) {
        AdminToast.show('بيانات الدخول غير صحيحة', 'error');
    } finally {
        hideLoader();
    }
};

window.logout = async function() {
    showLoader('جاري الخروج...');
    await supabaseClient.auth.signOut();
    hideLoader();
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('login-screen').classList.replace('hidden', 'flex');
    AdminToast.show('تم تسجيل الخروج');
};

async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('login-screen').classList.replace('flex', 'hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        fetchProducts();
    } else {
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('login-screen').classList.replace('hidden', 'flex');
    }
}

// ==================== Dashboard & Products ====================
async function fetchProducts() {
    showLoader('جاري جلب المنتجات...');
    try {
        const { data, error } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allProducts = data || [];
        updateStats();
        renderTable();
    } catch (error) {
        AdminToast.show('خطأ في جلب البيانات: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

function updateStats() {
    document.getElementById('stat-total').innerText = allProducts.length;
    document.getElementById('stat-featured').innerText = allProducts.filter(p => p.category === 'featured').length;
    document.getElementById('stat-out').innerText = allProducts.filter(p => p.stock <= 0).length;
    
    const value = allProducts.reduce((sum, p) => sum + (p.price * Math.max(0, p.stock || 0)), 0);
    document.getElementById('stat-value').innerText = value.toLocaleString() + ' ج.م';
}

function renderTable() {
    const tbody = document.getElementById('products-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const catFilter = document.getElementById('filter-category').value;
    
    let filtered = allProducts;
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    if (catFilter !== 'all') {
        if (catFilter === 'featured') {
            filtered = filtered.filter(p => p.category === 'featured');
        } else {
            filtered = filtered.filter(p => p.category === catFilter);
        }
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-gray-400">لا توجد منتجات مطابقة</td></tr>';
        return;
    }

    const categoryNames = { 'featured': 'منتجات مميزة ⭐', 'home': 'فوط التنظيف', 'skin': 'تنظيف البشرة', 'perfume': 'شنط وعطور', 'natural': 'منظفات طبيعية', 'packages': 'باكدجات' };

    tbody.innerHTML = filtered.map(product => {
        const stock = product.stock || 0;
        let stockBadge = '';
        if (stock <= 0) stockBadge = '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">نفذت الكمية (0)</span>';
        else if (stock <= 5) stockBadge = `<span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">منخفض (${stock})</span>`;
        else stockBadge = `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">متوفر (${stock})</span>`;

        const featuredBadge = product.category === 'featured' ? '<i class="ph-fill ph-star text-yellow-500 text-xl" title="مميز"></i>' : '<i class="ph ph-star text-gray-300 text-xl"></i>';
        const img = (product.images && product.images.length > 0) ? product.images[0] : (product.imageurl || '');

        return `
            <tr class="hover:bg-green-50/50 transition-colors">
                <td data-label="المنتج" class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                            ${img ? `<img src="${img}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center"><i class="ph-fill ph-image text-gray-400"></i></div>'}
                        </div>
                        <span class="font-bold text-gray-800">${product.name}</span>
                    </div>
                </td>
                <td data-label="السعر" class="px-6 py-4 font-bold text-green-700">${product.price} ج.م</td>
                <td data-label="القسم" class="px-6 py-4 text-gray-600">${categoryNames[product.category] || product.category}</td>
                <td data-label="المخزون" class="px-6 py-4 text-center">${stockBadge}</td>
                <td data-label="إجراءات" class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editProduct('${product.id}')" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center"><i class="ph-bold ph-pencil-simple"></i></button>
                        <button onclick="deleteProduct('${product.id}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"><i class="ph-bold ph-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('search-input')?.addEventListener('input', renderTable);
document.getElementById('filter-category')?.addEventListener('change', renderTable);

window.toggleFeatured = async function(id, isFeatured) {
    try {
        const { error } = await supabaseClient.from('products').update({ is_featured: isFeatured }).eq('id', id);
        if (error) throw error;
        
        // Update local state instantly
        const idx = allProducts.findIndex(p => p.id === id);
        if (idx !== -1) allProducts[idx].is_featured = isFeatured;
        updateStats();
        renderTable();
        AdminToast.show(isFeatured ? 'تم التعيين كمنتج مميز' : 'تمت إزالة التمييز');
    } catch(e) {
        AdminToast.show('خطأ في التحديث', 'error');
    }
}

// ==================== Advanced Image Manager ====================
let currentFormImages = []; // Array of { type: 'existing'|'new', url?: string, file?: File, previewUrl?: string }
let sortableInstance = null;

function initSortable() {
    const grid = document.getElementById('image-preview-grid');
    if (!grid) return;
    if (sortableInstance) sortableInstance.destroy();
    if (typeof Sortable !== 'undefined') {
        sortableInstance = new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            filter: '.img-delete-btn, .img-preview-actions',
            onEnd: function() {
                // Sync the array with DOM order
                const newOrder = [];
                const items = grid.querySelectorAll('.img-preview-item');
                items.forEach(el => {
                    const idx = parseInt(el.dataset.index);
                    if (!isNaN(idx) && currentFormImages[idx]) {
                        newOrder.push(currentFormImages[idx]);
                    }
                });
                currentFormImages = newOrder;
                renderImagePreview();
            }
        });
    }
}

function renderImagePreview() {
    const grid = document.getElementById('image-preview-grid');
    if (!grid) return;
    grid.innerHTML = currentFormImages.map((imgObj, idx) => {
        const src = imgObj.type === 'existing' ? imgObj.url : imgObj.previewUrl;
        return `
            <div class="img-preview-item" data-index="${idx}">
                <img src="${src}" alt="Preview">
                <div class="img-preview-actions">
                    <button type="button" class="img-delete-btn" onclick="removeImageFromForm(${idx})" title="حذف الصورة">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    initSortable();
}

window.removeImageFromForm = function(index) {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    const removed = currentFormImages.splice(index, 1)[0];
    if (removed && removed.type === 'new' && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
    }
    renderImagePreview();
}

async function compressImage(file, maxWidth = 1000, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    } else resolve(file);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

document.getElementById('p-image')?.addEventListener('change', async function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    showLoader('جاري ضغط ومعالجة الصور...');
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const compressed = await compressImage(file);
            currentFormImages.push({
                type: 'new',
                file: compressed,
                previewUrl: URL.createObjectURL(compressed)
            });
        }
        renderImagePreview();
    } catch(err) {
        console.error(err);
        AdminToast.show('حدث خطأ أثناء معالجة الصور', 'error');
    } finally {
        hideLoader();
        this.value = ''; // Reset input
    }
});

// ==================== Color Variations Management Logic ====================
window.toggleVariationsSection = function(checked) {
    const section = document.getElementById('variations-section');
    if (!section) return;
    if (checked) {
        section.classList.remove('hidden');
        const container = document.getElementById('variations-container');
        if (container && container.children.length === 0) {
            window.addVariationRow(); // Add an empty color card by default
        }
    } else {
        section.classList.add('hidden');
    }
};

window.addVariationRow = function(data = null) {
    const container = document.getElementById('variations-container');
    if (!container) return;
    
    const card = document.createElement('div');
    card.className = 'variation-card bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative group';
    
    const name = data ? (data.name || '') : '';
    const code = data ? (data.code || '#000000') : '#000000';
    const stock = data ? (data.stock !== undefined ? data.stock : 10) : 10;
    const sku = data ? (data.sku || '') : '';
    const priceDiff = data ? (data.priceDiff !== undefined ? data.priceDiff : 0) : 0;
    const images = data ? (data.images || []) : [];
    
    card.innerHTML = `
        <div class="absolute top-4 left-4">
            <button type="button" onclick="window.removeVariationRow(this)" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center" title="حذف هذا اللون">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <!-- Color Name -->
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">اسم اللون *</label>
                <input type="text" value="${name}" class="v-name w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs font-bold" required placeholder="مثال: أسود، أبيض">
            </div>
            <!-- Color Picker & HEX -->
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">كود اللون (HEX) *</label>
                <div class="flex gap-2">
                    <input type="color" value="${code}" class="v-color-picker w-9 h-9 p-0 bg-transparent border-0 cursor-pointer rounded-lg shrink-0" oninput="this.nextElementSibling.value = this.value">
                    <input type="text" value="${code}" class="v-color-hex w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs font-bold" required placeholder="#000000" oninput="this.previousElementSibling.value = this.value">
                </div>
            </div>
            <!-- Stock -->
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">كمية المخزون *</label>
                <input type="number" min="0" value="${stock}" class="v-stock w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs font-bold text-left" dir="ltr" required>
            </div>
            <!-- SKU -->
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">رمز الـ SKU (اختياري)</label>
                <input type="text" value="${sku}" class="v-sku w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs font-bold" placeholder="رمز المخزون">
            </div>
            <!-- Price Difference -->
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">فرق السعر (اختياري)</label>
                <input type="number" value="${priceDiff}" class="v-price-diff w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs font-bold text-left" dir="ltr">
            </div>
        </div>
        
        <!-- Image Gallery for Variation -->
        <div class="mt-4 border-t border-gray-100 pt-3">
            <label class="block text-xs font-bold text-gray-500 mb-2">صور اللون الخاص بالمتغير</label>
            <div class="flex flex-wrap items-center gap-3">
                <!-- Add Image Button -->
                <div class="relative w-20 h-20 bg-green-50/50 border border-dashed border-green-200 hover:bg-green-50 transition rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0">
                    <input type="file" accept="image/*" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onchange="window.uploadVariationImages(this)">
                    <i class="ph-bold ph-plus text-green-700 text-lg"></i>
                    <span class="text-[9px] font-bold text-green-700 mt-1">رفع صور</span>
                </div>
                <!-- Image list container -->
                <div class="v-images-list flex flex-wrap gap-2">
                    ${images.map(url => `
                        <div class="v-image-item relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0 group">
                            <img src="${url}" class="w-full h-full object-cover">
                            <button type="button" onclick="this.closest('.v-image-item').remove()" class="absolute top-1 left-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] shadow transition">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    container.appendChild(card);
};

window.removeVariationRow = function(btn) {
    if (!confirm('هل أنت متأكد من حذف هذا اللون بالكامل؟')) return;
    const card = btn.closest('.variation-card');
    if (card) card.remove();
};

window.uploadVariationImages = async function(input) {
    const files = input.files;
    if (!files || files.length === 0) return;
    
    const card = input.closest('.variation-card');
    const listContainer = card?.querySelector('.v-images-list');
    if (!listContainer) return;
    
    showLoader('جاري رفع ومعالجة صور اللون...');
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const compressed = await compressImage(file);
            
            const ext = compressed.name.split('.').pop();
            const fileName = `${Date.now()}_var_${Math.random().toString(36).substring(7)}.${ext}`;
            
            const { data, error } = await supabaseClient.storage.from('products').upload(fileName, compressed);
            if (error) throw error;
            
            const { data: { publicUrl } } = supabaseClient.storage.from('products').getPublicUrl(fileName);
            
            // Append to DOM
            const imgDiv = document.createElement('div');
            imgDiv.className = 'v-image-item relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0 group';
            imgDiv.innerHTML = `
                <img src="${publicUrl}" class="w-full h-full object-cover">
                <button type="button" onclick="this.closest('.v-image-item').remove()" class="absolute top-1 left-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] shadow transition">
                    <i class="ph ph-trash"></i>
                </button>
            `;
            listContainer.appendChild(imgDiv);
        }
        AdminToast.show('تم رفع الصور بنجاح');
    } catch(err) {
        console.error(err);
        AdminToast.show('حدث خطأ أثناء رفع الصور: ' + err.message, 'error');
    } finally {
        hideLoader();
        input.value = ''; // Reset input
    }
};

// ==================== Form Management ====================
window.showForm = function() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('p-category').value = '';
    document.getElementById('form-title').innerText = 'إضافة منتج جديد';
    currentFormImages = [];
    renderImagePreview();
    
    // Variations toggle reset
    const hasVar = document.getElementById('p-has-variations');
    if (hasVar) hasVar.checked = false;
    window.toggleVariationsSection(false);
    const container = document.getElementById('variations-container');
    if (container) container.innerHTML = '';
    
    document.getElementById('product-form-container').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.hideForm = function() {
    document.getElementById('product-form-container').classList.add('hidden');
    // Cleanup URLs
    currentFormImages.forEach(img => {
        if(img.type === 'new' && img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    currentFormImages = [];
    
    const container = document.getElementById('variations-container');
    if (container) container.innerHTML = '';
}

window.editProduct = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-id').value = product.id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-stock').value = product.stock || 0;
    
    // Parse variations from description
    const rawDesc = product.description || '';
    const descParts = rawDesc.split('===COLOR_VARIATIONS_JSON===');
    const cleanDesc = descParts[0].trim();
    document.getElementById('p-desc').value = cleanDesc;
    
    const hasVarInput = document.getElementById('p-has-variations');
    const varContainer = document.getElementById('variations-container');
    if (varContainer) varContainer.innerHTML = '';
    
    if (descParts.length > 1) {
        try {
            const variations = JSON.parse(descParts[1].trim());
            if (Array.isArray(variations) && variations.length > 0) {
                if (hasVarInput) hasVarInput.checked = true;
                window.toggleVariationsSection(true);
                // Clear default empty variation row created by toggleVariationsSection
                if (varContainer) varContainer.innerHTML = '';
                variations.forEach(v => window.addVariationRow(v));
            } else {
                if (hasVarInput) hasVarInput.checked = false;
                window.toggleVariationsSection(false);
            }
        } catch(e) {
            console.error("Error parsing variations on edit", e);
            if (hasVarInput) hasVarInput.checked = false;
            window.toggleVariationsSection(false);
        }
    } else {
        if (hasVarInput) hasVarInput.checked = false;
        window.toggleVariationsSection(false);
    }
    
    const featInput = document.getElementById('p-featured');
    if (featInput) featInput.checked = product.is_featured || false;

    currentFormImages = [];
    const imgs = (product.images && product.images.length > 0) ? product.images : (product.imageurl ? [product.imageurl] : []);
    imgs.forEach(url => {
        if(url) currentFormImages.push({ type: 'existing', url: url });
    });
    
    document.getElementById('form-title').innerText = 'تعديل المنتج';
    renderImagePreview();
    document.getElementById('product-form-container').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('product-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const category = document.getElementById('p-category').value;
    const stock = parseInt(document.getElementById('p-stock').value) || 0;
    const description = document.getElementById('p-desc').value;
    
// هنا بنقوله لو القسم اللي اخترته هو featured، خلي المنتج مميز، غير كده خليه فولس
const is_featured = (category === 'featured');

    showLoader(id ? 'جاري حفظ التعديلات...' : 'جاري إضافة المنتج...');

    try {
        let finalImages = [];
        const originalProduct = id ? allProducts.find(p => p.id === id) : null;
        const originalImages = originalProduct ? ((originalProduct.images && originalProduct.images.length > 0) ? originalProduct.images : [originalProduct.imageurl]) : [];

        // Upload new images and preserve existing ones in order
        for (const imgObj of currentFormImages) {
            if (imgObj.type === 'existing') {
                finalImages.push(imgObj.url);
            } else if (imgObj.type === 'new') {
                const ext = imgObj.file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { data, error } = await supabaseClient.storage.from('products').upload(fileName, imgObj.file);
                if (error) throw error;
                const { data: { publicUrl } } = supabaseClient.storage.from('products').getPublicUrl(fileName);
                finalImages.push(publicUrl);
            }
        }

        // Identify images removed by the user and delete them from Supabase Storage
        if (originalImages) {
            const filesToRemove = [];
            originalImages.forEach(oldUrl => {
                if (oldUrl && !finalImages.includes(oldUrl)) {
                    const urlParts = oldUrl.split('/products/');
                    if (urlParts.length > 1) filesToRemove.push(urlParts[1]);
                }
            });
            if (filesToRemove.length > 0) {
                await supabaseClient.storage.from('products').remove(filesToRemove);
            }
        }

        // Handle variations
        let finalDescription = description;
        let finalStock = stock;
        
        const hasVariations = document.getElementById('p-has-variations')?.checked;
        if (hasVariations) {
            const varCards = document.querySelectorAll('.variation-card');
            const variations = [];
            let totalVarStock = 0;
            
            varCards.forEach(card => {
                const vName = card.querySelector('.v-name')?.value || '';
                const vCode = card.querySelector('.v-color-hex')?.value || '#000000';
                const vStock = parseInt(card.querySelector('.v-stock')?.value) || 0;
                const vSku = card.querySelector('.v-sku')?.value || '';
                const vPriceDiff = parseFloat(card.querySelector('.v-price-diff')?.value) || 0;
                
                const vImages = Array.from(card.querySelectorAll('.v-images-list img')).map(img => img.src);
                
                if (vName) {
                    variations.push({
                        name: vName,
                        code: vCode,
                        stock: vStock,
                        sku: vSku,
                        priceDiff: vPriceDiff,
                        images: vImages
                    });
                    totalVarStock += vStock;
                }
            });
            
            if (variations.length > 0) {
                finalDescription = `${description.trim()}\n\n===COLOR_VARIATIONS_JSON===\n${JSON.stringify(variations)}`;
                finalStock = totalVarStock; // Set overall product stock to sum of color stocks
            }
        }

        const productData = { 
            name, price, category, description: finalDescription, stock: finalStock, is_featured, 
            images: finalImages,
            imageurl: finalImages.length > 0 ? finalImages[0] : null // Backward compatibility
        };

        if (id) {
            const { error } = await supabaseClient.from('products').update(productData).eq('id', id);
            if (error) throw error;
            AdminToast.show('تم تحديث المنتج بنجاح');
        } else {
            const { error } = await supabaseClient.from('products').insert([productData]);
            if (error) throw error;
            AdminToast.show('تمت إضافة المنتج بنجاح');
        }

        hideForm();
        fetchProducts();
        
    } catch (error) {
        console.error(error);
        AdminToast.show('حدث خطأ: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
});

window.deleteProduct = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    showLoader('جاري الحذف...');
    try {
        const product = allProducts.find(p => p.id === id);
        
        // Delete from DB
        const { error: dbError } = await supabaseClient.from('products').delete().eq('id', id);
        if (dbError) throw dbError;

        // Cleanup Storage to save space
        const imgs = (product.images && product.images.length > 0) ? product.images : (product.imageurl ? [product.imageurl] : []);
        const filesToRemove = [];
        imgs.forEach(imgUrl => {
            if(!imgUrl) return;
            const urlParts = imgUrl.split('/products/');
            if (urlParts.length > 1) filesToRemove.push(urlParts[1]);
        });
        
        if (filesToRemove.length > 0) {
            await supabaseClient.storage.from('products').remove(filesToRemove);
        }

        AdminToast.show('تم حذف المنتج وتفريغ مساحة التخزين بنجاح');
        fetchProducts();
        
    } catch (error) {
        AdminToast.show('حدث خطأ أثناء الحذف: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
};

// ==================== Navigation & Sections Switching ====================
window.switchSection = function(section) {
    document.querySelectorAll('.section-pane').forEach(pane => pane.classList.add('hidden'));
    document.getElementById(`section-${section}`).classList.remove('hidden');
    
    const navProducts = document.getElementById('nav-products');
    const navFeatured = document.getElementById('nav-featured');
    
    if (section === 'products') {
        if (navProducts) navProducts.className = "sidebar-link active flex items-center gap-3 px-4 py-3 text-white rounded-xl font-bold transition-all";
        if (navFeatured) navFeatured.className = "sidebar-link flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white rounded-xl font-bold transition-all";
    } else {
        if (navFeatured) navFeatured.className = "sidebar-link active flex items-center gap-3 px-4 py-3 text-white rounded-xl font-bold transition-all";
        if (navProducts) navProducts.className = "sidebar-link flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white rounded-xl font-bold transition-all";
        renderFeaturedSection();
    }
    
    // Close mobile nav menu if open
    const navMenu = document.getElementById('nav-menu');
    if (navMenu && window.innerWidth < 768) {
        navMenu.classList.add('hidden');
    }
};

// ==================== Featured Products Administration Logic ====================
function renderFeaturedSection() {
    const featuredList = allProducts.filter(p => p.category === 'featured');
    
    // Update featured count badge
    const badge = document.getElementById('featured-count-badge');
    if (badge) badge.innerText = featuredList.length;
    
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    
    if (featuredList.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div class="w-16 h-16 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center text-3xl">
                    <i class="ph ph-star-half"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-lg">لا توجد منتجات مميزة حالياً</h4>
                <p class="text-gray-400 text-sm max-w-sm">استخدم شريط البحث أعلاه لإيجاد المنتجات وتعيينها كمنتجات مميزة لتظهر على الواجهة الرئيسية للموقع.</p>
            </div>
        `;
        return;
    }
    
  const categoryNames = { 'featured': 'منتجات مميزة ⭐', 'home': 'فوط التنظيف', 'skin': 'تنظيف البشرة', 'perfume': 'شنط وعطور', 'natural': 'منظفات طبيعية', 'packages': 'باكدجات' };
    
    grid.innerHTML = featuredList.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageurl || '');
        return `
            <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full" id="featured-card-${p.id}">
                <div class="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative mb-4 animate-pulse-once">
                    ${img ? `<img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` : '<div class="w-full h-full flex items-center justify-center"><i class="ph-fill ph-image text-gray-300 text-4xl"></i></div>'}
                    <div class="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        ⭐ مميز
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-between">
                    <div class="mb-3">
                        <span class="text-xs font-bold text-gray-400 block mb-1">${categoryNames[p.category] || p.category}</span>
                        <h4 class="font-bold text-gray-800 leading-tight group-hover:text-green-800 transition line-clamp-2">${p.name}</h4>
                    </div>
                    <div>
                        <div class="text-lg font-black text-green-700 mb-3">${p.price} ج.م</div>
                        <button onclick="removeFeatured('${p.id}')" class="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-red-100 hover:border-transparent active:scale-95 shadow-sm">
                            <i class="ph-bold ph-trash"></i> إزالة من المميزة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Remove from featured function with animation
window.removeFeatured = async function(id) {
    const card = document.getElementById(`featured-card-${id}`);
    if (card) {
        card.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9) translateY(10px)';
    }
    
    try {
        const { error } = await supabaseClient.from('products').update({ category: 'home', is_featured: false }).eq('id', id);
        if (error) throw error;
        
        // Update local state instantly
        const idx = allProducts.findIndex(p => p.id === id);
        if (idx !== -1) {
            allProducts[idx].category = 'home';
            allProducts[idx].is_featured = false;
        }
        
        updateStats();
        setTimeout(() => {
            renderFeaturedSection();
        }, 250);
        
        AdminToast.show('تمت إزالة المنتج من القائمة المميزة بنجاح ✓');
    } catch(e) {
        if (card) {
            card.style.opacity = '1';
            card.style.transform = 'none';
        }
        AdminToast.show('حدث خطأ أثناء التحديث: ' + e.message, 'error');
    }
};

// Add to featured search logic
document.getElementById('featured-search-add')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    const dropdown = document.getElementById('featured-search-results');
    if (!dropdown) return;
    
    if (!query) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
    }
    
    // Filter non-featured products that match query
    const matches = allProducts.filter(p => p.category !== 'featured' && p.name.toLowerCase().includes(query));
    
    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="p-4 text-center text-gray-400 font-bold text-sm">لا توجد منتجات مطابقة غير مميزة</div>';
        dropdown.classList.remove('hidden');
        return;
    }
    
    const categoryNames = { 'featured': 'منتجات مميزة ⭐', 'home': 'فوط التنظيف', 'skin': 'تنظيف البشرة', 'perfume': 'شنط وعطور', 'natural': 'منظفات طبيعية', 'packages': 'باكدجات' };
    
    dropdown.innerHTML = matches.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageurl || '');
        return `
            <div onclick="addFeatured('${p.id}')" class="p-3 hover:bg-green-50 transition-colors flex items-center justify-between cursor-pointer border-b border-gray-50 last:border-0">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                        ${img ? `<img src="${img}" class="w-full h-full object-cover">` : '<i class="ph ph-image text-gray-300 text-xl w-full h-full flex items-center justify-center"></i>'}
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-gray-800 text-sm truncate leading-snug">${p.name}</h4>
                        <span class="text-[10px] font-bold text-gray-400">${categoryNames[p.category] || p.category}</span>
                    </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs font-black text-green-700 font-sans">${p.price} ج.م</span>
                    <button class="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                        <i class="ph ph-plus"></i> إضافة
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    dropdown.classList.remove('hidden');
});

// Add to featured action
window.addFeatured = async function(id) {
    const input = document.getElementById('featured-search-add');
    const dropdown = document.getElementById('featured-search-results');
    if (input) input.value = '';
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
    }
    
    try {
        const { error } = await supabaseClient.from('products').update({ category: 'featured', is_featured: true }).eq('id', id);
        if (error) throw error;
        
        // Update local state instantly
        const idx = allProducts.findIndex(p => p.id === id);
        if (idx !== -1) {
            allProducts[idx].category = 'featured';
            allProducts[idx].is_featured = true;
        }
        
        updateStats();
        renderFeaturedSection();
        AdminToast.show('تمت إضافة المنتج للمجموعة المميزة بنجاح ⭐ ✓');
    } catch(e) {
        AdminToast.show('حدث خطأ أثناء الإضافة: ' + e.message, 'error');
    }
};

// Close search dropdown on clicking outside
document.addEventListener('click', function(e) {
    const results = document.getElementById('featured-search-results');
    const input = document.getElementById('featured-search-add');
    if (results && !results.contains(e.target) && e.target !== input) {
        results.classList.add('hidden');
    }
});

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', checkAuthStatus);