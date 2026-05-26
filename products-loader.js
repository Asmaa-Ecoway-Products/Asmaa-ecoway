
// products-loader.js - جلب وعرض المنتجات من Supabase
const SUPABASE_URL = 'https://oybviqlrlsprjrhjftvs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YnZpcWxybHNwcmpyaGpmdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODgyMzAsImV4cCI6MjA5MjU2NDIzMH0.rPDNAZe9DNTi3eQd3L_lnLrEgQ8g8uwr6GAWhnydVIc';

if (!window._ecoSupabase && window.supabase) {
    window._ecoSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
const supabaseClient = window._ecoSupabase || window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

const WHATSAPP_NUMBER = '201129846584';

/**
 * جلب المنتجات من Supabase
 * @param {string|null} category - فلتر القسم
 * @param {boolean} featuredOnly - جلب المنتجات المميزة فقط
 */
async function fetchStoreProducts(category = null, featuredOnly = false) {
    let query = supabaseClient.from('products').select('*').order('created_at', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    if (featuredOnly) {
        // Only show products explicitly assigned to the 'featured' category
        query = query.eq('category', 'featured');
    }

    const { data: products, error } = await query;

    if (error) {
        console.error('خطأ في جلب المنتجات:', error);
        return [];
    }
    return products || [];
}

/**
 * إضافة منتج للسلة بأمان من كارت المنتج (كمية = 1 فقط)
 * @param {HTMLButtonElement} btn - زر الإضافة
 */
async function handleCardAddToCart(btn) {
    if (btn.disabled || btn.dataset.loading === 'true') return;

    const productId = btn.dataset.productId;
    const productName = btn.dataset.productName;
    const productPrice = Number(btn.dataset.productPrice);
    const productImage = btn.dataset.productImage || '';
    const productStock = Number(btn.dataset.productStock) || 999;

    if (!productId || !window.CartSystem) return;

    // Set loading state
    btn.dataset.loading = 'true';
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> جاري الإضافة...';
    btn.classList.add('opacity-75', 'pointer-events-none');

    try {
        await window.CartSystem.addItem({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1,
            stock: productStock
        });

        // Success state
        btn.innerHTML = '<i class="ph ph-check-circle text-xl"></i> تمت الإضافة ✓';
        btn.classList.remove('opacity-75');
        btn.classList.add('bg-green-600');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('bg-green-600', 'pointer-events-none');
            btn.dataset.loading = 'false';
        }, 1500);
    } catch (err) {
        console.error('Add to cart error:', err);
        btn.innerHTML = '<i class="ph ph-warning text-xl"></i> حدث خطأ';
        btn.classList.remove('opacity-75');
        btn.classList.add('bg-red-600');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('bg-red-600', 'pointer-events-none');
            btn.dataset.loading = 'false';
        }, 2000);
    }
}

// Expose globally
window.handleCardAddToCart = handleCardAddToCart;

/**
 * رسم المنتجات
 * @param {string} containerId
 * @param {string|null} category
 * @param {boolean} featuredOnly
 */
async function renderStoreProducts(containerId, category = null, featuredOnly = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mb-4"></div>
            <p class="text-gray-500 font-bold">جاري تحميل أحدث المنتجات...</p>
        </div>
    `;

    const products = await fetchStoreProducts(category, featuredOnly);
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-16 text-gray-500 font-bold text-xl">نعتذر، لا توجد منتجات في هذا القسم حالياً.</div>';
        return;
    }

    products.forEach(product => {
        const mainImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageurl || '');
        const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
        const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= 5;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group relative';

        // Build card HTML without inline onclick for add-to-cart
        card.innerHTML = `
            ${product.category === 'featured' ? '<div class="absolute top-6 right-6 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">مميز ⭐</div>' : ''}
            ${isOutOfStock ? '<div class="absolute top-6 left-6 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">نفذت الكمية</div>' : ''}
            ${isLowStock ? `<div class="absolute top-6 left-6 z-10 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">متبقي ${product.stock} فقط!</div>` : ''}
            
            <a href="product.html?id=${product.id}" class="block aspect-square rounded-[1.5rem] mb-4 overflow-hidden bg-gray-50 relative ${isOutOfStock ? 'opacity-50 grayscale' : ''}">
                <img src="${mainImage}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy">
            </a>
            
            <div class="text-center flex-1 flex flex-col justify-between px-2">
                <div>
                    <a href="product.html?id=${product.id}" class="block">
                        <h3 class="font-bold text-gray-900 text-lg mb-1 hover:text-green-700 transition line-clamp-1">${product.name}</h3>
                    </a>
                    <div class="flex items-center justify-center gap-1 text-yellow-400 text-sm mb-4">
                        <i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i>
                        <span class="text-gray-400 text-xs mr-1 font-normal">(5.0)</span>
                    </div>
                </div>
                
                <div class="mt-auto">
                    <div class="text-xl font-black text-green-800 mb-4">
                        ${product.price} <span class="text-sm font-normal text-gray-500">جنيه</span>
                    </div>
                    
                    ${isOutOfStock ? `
                    <button disabled class="w-full bg-gray-300 text-gray-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                        <i class="ph ph-prohibit text-xl"></i> نفذت الكمية
                    </button>
                    ` : `
                    <button class="eco-add-to-cart-btn w-full bg-[#2d5a27] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-800 active:scale-95 transition-all shadow-md hover:shadow-lg"
                        data-product-id="${product.id}"
                        data-product-name="${product.name.replace(/"/g, '&quot;')}"
                        data-product-price="${product.price}"
                        data-product-image="${mainImage.replace(/"/g, '&quot;')}"
                        data-product-stock="${product.stock || 999}">
                        <i class="ph ph-shopping-cart-simple text-xl"></i> أضف للسلة
                    </button>
                    `}
                </div>
            </div>
        `;

        // Attach safe event listener to the add-to-cart button
        const addBtn = card.querySelector('.eco-add-to-cart-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleCardAddToCart(this);
            });
        }

        container.appendChild(card);
    });
}
