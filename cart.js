// cart.js - نظام السلة الموحد + Toast Notifications + التحقق من المخزون
(function () {
    'use strict';

    // ==================== Supabase Config ====================
    const SUPABASE_URL = 'https://oybviqlrlsprjrhjftvs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YnZpcWxybHNwcmpyaGpmdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODgyMzAsImV4cCI6MjA5MjU2NDIzMH0.rPDNAZe9DNTi3eQd3L_lnLrEgQ8g8uwr6GAWhnydVIc';

    function getSupabase() {
        if (!window._ecoSupabase && window.supabase) {
            window._ecoSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        return window._ecoSupabase || null;
    }

    // ==================== Toast Notification System ====================
    const ToastSystem = {
        container: null,

        init() {
            if (this.container) return;
            this.container = document.createElement('div');
            this.container.id = 'eco-toast-container';
            this.container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;width:90%;max-width:420px;';
            document.body.appendChild(this.container);

            if (!document.getElementById('eco-toast-styles')) {
                const style = document.createElement('style');
                style.id = 'eco-toast-styles';
                style.textContent = `
                    .eco-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:16px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;color:#fff;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,.18);animation:ecoToastIn .4s cubic-bezier(.21,1.02,.73,1) forwards;direction:rtl;line-height:1.5;max-width:100%;word-break:break-word}
                    .eco-toast.removing{animation:ecoToastOut .35s cubic-bezier(.55,.06,.68,.19) forwards}
                    .eco-toast .eco-toast-icon{font-size:22px;flex-shrink:0}
                    .eco-toast.success{background:linear-gradient(135deg,#2d5a27dd,#4c8c4add)}
                    .eco-toast.error{background:linear-gradient(135deg,#c62828dd,#e53935dd)}
                    .eco-toast.warning{background:linear-gradient(135deg,#e65100dd,#f57c00dd)}
                    .eco-toast.info{background:linear-gradient(135deg,#1565c0dd,#1e88e5dd)}
                    @keyframes ecoToastIn{0%{opacity:0;transform:translateY(-20px) scale(.92)}100%{opacity:1;transform:translateY(0) scale(1)}}
                    @keyframes ecoToastOut{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-20px) scale(.85)}}
                `;
                document.head.appendChild(style);
            }
        },

        show(message, type = 'info', duration = 3500) {
            this.init();
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
            const toast = document.createElement('div');
            toast.className = `eco-toast ${type}`;
            toast.innerHTML = `<span class="eco-toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
            this.container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 350);
            }, duration);
        },

        success(msg, dur) { this.show(msg, 'success', dur); },
        error(msg, dur) { this.show(msg, 'error', dur); },
        warning(msg, dur) { this.show(msg, 'warning', dur); },
        info(msg, dur) { this.show(msg, 'info', dur); }
    };

    window.EcoToast = ToastSystem;

    // ==================== Cart Manager ====================
    const CART_KEY = 'asmaaEcoCart';

    const CartManager = {
        items: [],

        init() {
            try {
                this.items = JSON.parse(localStorage.getItem(CART_KEY)) || [];
            } catch (e) { this.items = []; }
            this._injectDrawerStyles();
            this._ensureDrawer();
            this.updateBadge();
            this.renderDrawer();

            window.addEventListener('storage', (e) => {
                if (e.key === CART_KEY) {
                    this.items = JSON.parse(localStorage.getItem(CART_KEY)) || [];
                    this.updateBadge();
                    this.renderDrawer();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeDrawer();
                }
            });

            this.validateCartItems();
        },

        save() {
            localStorage.setItem(CART_KEY, JSON.stringify(this.items));
            this.updateBadge();
            this.renderDrawer();
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.items }));
        },

        async validateCartItems() {
            if (this.items.length === 0) return;
            const ids = this.items.map(item => item.id);
            const sb = getSupabase();
            if (!sb) return;

            try {
                const { data, error } = await sb.from('products').select('id, name, price, stock').in('id', ids);
                if (error) throw error;

                const dbProducts = new Map((data || []).map(p => [p.id, p]));
                let changed = false;
                let removedAny = false;
                let stockCapped = false;

                // Filter out deleted products
                this.items = this.items.filter(item => {
                    const exists = dbProducts.has(item.id);
                    if (!exists) {
                        removedAny = true;
                        changed = true;
                    }
                    return exists;
                });

                // Update prices and check stock limits for existing ones
                this.items.forEach(item => {
                    const dbItem = dbProducts.get(item.id);
                    if (dbItem) {
                        const newPrice = Number(dbItem.price);
                        if (item.price !== newPrice) {
                            item.price = newPrice;
                            changed = true;
                        }
                        
                        const dbStock = dbItem.stock !== null && dbItem.stock !== undefined ? dbItem.stock : 999;
                        if (item.stock !== dbStock) {
                            item.stock = dbStock;
                            changed = true;
                        }

                        if (dbStock <= 0) {
                            item.outOfStock = true;
                        } else {
                            item.outOfStock = false;
                            if (item.quantity > dbStock) {
                                item.quantity = dbStock;
                                stockCapped = true;
                                changed = true;
                            }
                        }
                    }
                });

                if (changed) {
                    this.save();
                    if (removedAny) {
                        EcoToast.warning('تمت إزالة بعض المنتجات من السلة لأنها لم تعد متوفرة في المتجر ⚠️', 4500);
                    }
                    if (stockCapped) {
                        EcoToast.warning('تم تعديل كمية بعض المنتجات بالسلة لتناسب المخزون المتاح ⚠️', 4500);
                    }
                } else {
                    this.renderDrawer();
                }
            } catch (e) {
                console.warn('Real-time cart validation failed:', e);
            }
        },

        async addItem(product) {
            if (!product || !product.id) return;

            // Real-time stock check from Supabase
            const sb = getSupabase();
            let dbStock = null;
            if (sb) {
                try {
                    const { data } = await sb.from('products').select('stock').eq('id', product.id).single();
                    if (data) dbStock = data.stock;
                } catch (e) { console.warn('Stock check failed:', e); }
            }

            const currentStock = dbStock !== null ? dbStock : (product.stock !== undefined ? product.stock : 999);
            const existingItem = this.items.find(i => i.id === product.id);
            const currentQtyInCart = existingItem ? existingItem.quantity : 0;
            const addQty = product.quantity || 1;

            if (currentStock <= 0) {
                EcoToast.error('عذراً، هذا المنتج نفذ من المخزون');
                return;
            }

            if (currentQtyInCart + addQty > currentStock) {
                EcoToast.warning(`عذراً، الكمية المتوفرة ${currentStock} قطعة فقط`);
                return;
            }

            if (existingItem) {
                existingItem.quantity += addQty;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image || '',
                    quantity: addQty,
                    selectedColor: product.selectedColor || null,
                    stock: currentStock
                });
            }

            this.save();
            EcoToast.success('تمت الإضافة للسلة ✓');
            this.openDrawer();
        },

        removeItem(productId) {
            this.items = this.items.filter(i => i.id !== productId);
            this.save();
        },

        async updateQuantity(productId, delta) {
            const item = this.items.find(i => i.id === productId);
            if (!item) return;

            const newQty = item.quantity + delta;
            if (newQty <= 0) { this.removeItem(productId); return; }

            // Stock check for increase
            if (delta > 0) {
                const sb = getSupabase();
                let dbStock = item.stock || 999;
                if (sb) {
                    try {
                        const { data } = await sb.from('products').select('stock').eq('id', productId).single();
                        if (data) dbStock = data.stock;
                    } catch (e) { }
                }
                if (newQty > dbStock) {
                    EcoToast.warning(`عذراً، الكمية المتوفرة ${dbStock} قطعة فقط`);
                    return;
                }
            }

            item.quantity = newQty;
            this.save();
        },

        getTotal() {
            return this.items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
        },

        getCount() {
            return this.items.reduce((s, i) => s + (i.quantity || 1), 0);
        },

        updateBadge() {
            const total = this.getCount();
            document.querySelectorAll('#cart-count').forEach(b => {
                b.textContent = total;
                if (total > 0) { b.classList.remove('hidden'); b.classList.add('flex'); }
                else { b.classList.add('hidden'); b.classList.remove('flex'); }
            });
        },

        _injectDrawerStyles() {
            if (document.getElementById('eco-cart-styles')) return;
            const s = document.createElement('style');
            s.id = 'eco-cart-styles';
            s.textContent = `
                #eco-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;opacity:0;visibility:hidden;transition:all .3s ease}
                #eco-cart-overlay.active{opacity:1;visibility:visible}
                #eco-cart-drawer{position:fixed;top:0;right:0;width:100%;max-width:400px;height:100%;background:#fff;z-index:9999;transform:translateX(100%);transition:transform .35s cubic-bezier(.25,.8,.25,1);display:flex;flex-direction:column;box-shadow:-4px 0 25px rgba(0,0,0,.15);font-family:'Cairo',sans-serif}
                #eco-cart-drawer.open{transform:translateX(0)}
                .eco-cart-header{padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#e8f3e8,#d4e8d4)}
                .eco-cart-header h2{font-size:18px;font-weight:800;color:#2d5a27;display:flex;align-items:center;gap:8px}
                .eco-cart-close{width:36px;height:36px;border-radius:50%;background:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;font-size:18px;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.08)}
                .eco-cart-close:hover{color:#ef4444;background:#fef2f2}
                .eco-cart-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#fafafa}
                .eco-cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9ca3af;text-align:center;gap:12px}
                .eco-cart-empty i{font-size:64px;color:#e5e7eb}
                .eco-cart-item{display:flex;gap:12px;background:#fff;padding:12px;border-radius:16px;border:1px solid #f3f4f6;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:all .2s}
                .eco-cart-item:hover{border-color:#d1fae5;box-shadow:0 4px 12px rgba(45,90,39,.08)}
                .eco-cart-item img{width:72px;height:72px;object-fit:cover;border-radius:12px;flex-shrink:0}
                .eco-cart-item-info{flex:1;display:flex;flex-direction:column;justify-content:space-between}
                .eco-cart-item-name{font-weight:700;font-size:13px;color:#1f2937;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
                .eco-cart-item-price{font-weight:800;color:#2d5a27;font-size:14px}
                .eco-cart-qty{display:flex;align-items:center;gap:6px;margin-top:6px}
                .eco-cart-qty button{width:28px;height:28px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#6b7280;transition:all .2s}
                .eco-cart-qty button:hover{border-color:#2d5a27;color:#2d5a27;background:#e8f3e8}
                .eco-cart-qty span{font-weight:700;font-size:14px;min-width:20px;text-align:center;color:#374151}
                .eco-cart-remove{background:none;border:none;color:#d1d5db;cursor:pointer;padding:4px;margin-right:auto;font-size:18px;transition:color .2s}
                .eco-cart-remove:hover{color:#ef4444}
                .eco-cart-footer{padding:16px 20px;border-top:1px solid #e5e7eb;background:#fff;box-shadow:0 -2px 10px rgba(0,0,0,.04)}
                .eco-cart-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:16px}
                .eco-cart-total span:first-child{font-weight:700;color:#6b7280}
                .eco-cart-total span:last-child{font-weight:900;color:#2d5a27;font-size:20px}
                .eco-cart-checkout{display:block;width:100%;padding:14px;background:linear-gradient(135deg,#2d5a27,#4c8c4a);color:#fff;border:none;border-radius:14px;font-weight:800;font-size:16px;font-family:'Cairo',sans-serif;cursor:pointer;text-align:center;text-decoration:none;transition:all .3s;box-shadow:0 4px 15px rgba(45,90,39,.3)}
                .eco-cart-checkout:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(45,90,39,.4)}
            `;
            document.head.appendChild(s);
        },

        _ensureDrawer() {
            // Remove any existing cart drawers to prevent duplicates
            const existingDrawer = document.getElementById('eco-cart-drawer');
            const existingOverlay = document.getElementById('eco-cart-overlay');
            if (existingDrawer) return; // Already set up

            const overlay = document.createElement('div');
            overlay.id = 'eco-cart-overlay';
            overlay.addEventListener('click', () => this.closeDrawer());

            const drawer = document.createElement('div');
            drawer.id = 'eco-cart-drawer';
            drawer.innerHTML = `
                <div class="eco-cart-header">
                    <h2><i class="ph ph-shopping-cart" style="font-size:24px"></i> سلة المشتريات</h2>
                    <button class="eco-cart-close" onclick="window.CartSystem.closeDrawer()"><i class="ph ph-x"></i></button>
                </div>
                <div class="eco-cart-body" id="eco-cart-items"></div>
                <div class="eco-cart-footer">
                    <div class="eco-cart-total">
                        <span>الإجمالي:</span>
                        <span id="eco-cart-total-value">0 ج.م</span>
                    </div>
                    <a href="checkout.html" class="eco-cart-checkout">إتمام الطلب</a>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(drawer);
        },

        renderDrawer() {
            const container = document.getElementById('eco-cart-items');
            if (!container) return;

            if (this.items.length === 0) {
                container.innerHTML = '<div class="eco-cart-empty"><i class="ph-fill ph-shopping-cart"></i><p style="font-weight:700;font-size:16px">سلة المشتريات فارغة</p></div>';
            } else {
                container.innerHTML = this.items.map(item => {
                    const isOutOfStock = item.outOfStock || (item.stock !== null && item.stock !== undefined && item.stock <= 0);
                    return `
                        <div class="eco-cart-item ${isOutOfStock ? 'opacity-75 border-red-200 bg-red-50/10' : ''}" style="${isOutOfStock ? 'border: 1px solid #fee2e2; background-color: #fef2f255;' : ''}">
                            <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'">
                            <div class="eco-cart-item-info">
                                <div class="eco-cart-item-name">${item.name}</div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin: 4px 0 2px 0;">
                                    <div class="eco-cart-item-price">${(item.price * (item.quantity || 1)).toFixed(0)} ج.م</div>
                                    ${isOutOfStock ? '<span style="background-color:#fee2e2; color:#dc2626; padding: 2px 8px; border-radius: 6px; font-size:11px; font-weight:800; display:inline-block;">نفذ ❌</span>' : ''}
                                </div>
                                <div class="eco-cart-qty">
                                    <button onclick="window.CartSystem.updateQuantity('${item.id}', -1)">−</button>
                                    <span>${item.quantity || 1}</span>
                                    <button onclick="window.CartSystem.updateQuantity('${item.id}', 1)" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>+</button>
                                    <button class="eco-cart-remove" onclick="window.CartSystem.removeItem('${item.id}')"><i class="ph ph-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const totalEl = document.getElementById('eco-cart-total-value');
            if (totalEl) totalEl.textContent = this.getTotal().toFixed(0) + ' ج.م';

            // Disable or Enable the checkout button based on stock availability
            const hasOutOfStock = this.items.some(item => item.outOfStock || (item.stock !== null && item.stock !== undefined && item.stock <= 0));
            const checkoutBtn = document.querySelector('.eco-cart-checkout');
            if (checkoutBtn) {
                if (hasOutOfStock) {
                    checkoutBtn.innerHTML = '<i class="ph ph-warning-circle text-xl"></i> السلة تحتوي على منتجات نفذت';
                    checkoutBtn.style.background = '#9ca3af';
                    checkoutBtn.style.pointerEvents = 'none';
                    checkoutBtn.style.cursor = 'not-allowed';
                    checkoutBtn.style.boxShadow = 'none';
                } else {
                    checkoutBtn.innerHTML = 'إتمام الطلب';
                    checkoutBtn.style.background = '';
                    checkoutBtn.style.pointerEvents = '';
                    checkoutBtn.style.cursor = '';
                    checkoutBtn.style.boxShadow = '';
                }
            }

            // Also update any legacy cart containers
            this._syncLegacyContainers();
        },

        _syncLegacyContainers() {
            // Sync legacy #cart-items container (checkout.html uses this)
            const legacyContainer = document.getElementById('cart-items');
            const legacyTotal = document.getElementById('cart-total');
            if (legacyContainer && legacyContainer.closest('#eco-cart-drawer') === null) {
                // This is a page-specific cart display, update it
                if (this.items.length === 0) {
                    legacyContainer.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:40px 0">السلة فارغة حالياً</div>';
                } else {
                    legacyContainer.innerHTML = this.items.map((item, idx) => {
                        const isOutOfStock = item.outOfStock || (item.stock !== null && item.stock !== undefined && item.stock <= 0);
                        return `
                            <div style="background:#f9fafb;padding:12px;border-radius:12px;border:1px solid ${isOutOfStock ? '#fee2e2' : '#f3f4f6'};margin-bottom:8px;opacity:${isOutOfStock ? '0.75' : '1'};">
                                <div style="display:flex;align-items:flex-start;gap:12px">
                                    <div style="width:40px;height:40px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
                                        ${item.image ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover">` : '<i class="ph-fill ph-package"></i>'}
                                    </div>
                                    <div style="flex:1;min-width:0">
                                        <h4 style="font-weight:700;font-size:13px;color:#1f2937;margin-bottom:4px">${item.name}</h4>
                                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                                            <span style="font-size:12px;color:#9ca3af">الكمية: ${item.quantity || 1}</span>
                                            ${isOutOfStock ? '<span style="font-weight:bold;color:#dc2626;font-size:11px;background-color:#fee2e2;padding:1px 6px;border-radius:4px;">نفذ ❌</span>' : ''}
                                            <span style="font-weight:700;color:#2d5a27;font-size:13px">${(item.price * (item.quantity || 1)).toFixed(0)} جنيه</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
                if (legacyTotal) legacyTotal.textContent = this.getTotal().toFixed(0) + ' جنيه';
            }
        },

        openDrawer() {
            const d = document.getElementById('eco-cart-drawer');
            const o = document.getElementById('eco-cart-overlay');
            if (d && o) {
                o.classList.add('active');
                d.classList.add('open');
                document.body.style.overflow = 'hidden';
                this.validateCartItems();
            }
        },

        closeDrawer() {
            const d = document.getElementById('eco-cart-drawer');
            const o = document.getElementById('eco-cart-overlay');
            if (d && o) {
                d.classList.remove('open');
                o.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        toggleDrawer() {
            const d = document.getElementById('eco-cart-drawer');
            d && d.classList.contains('open') ? this.closeDrawer() : this.openDrawer();
        }
    };

    // ==================== Initialize on DOM Ready ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CartManager.init());
    } else {
        CartManager.init();
    }

    // ==================== Public API ====================
    window.CartSystem = CartManager;
    window.EcoToast = ToastSystem;

    // Backward compatibility
    window.toggleCart = () => CartManager.toggleDrawer();
    window.toggleCartDrawer = () => CartManager.toggleDrawer();

    // Hide old cart drawers that conflict
    document.addEventListener('DOMContentLoaded', () => {
        // Hide legacy drawers
        ['cart-drawer', 'cart-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.id !== 'eco-cart-drawer' && el.id !== 'eco-cart-overlay') {
                el.style.display = 'none';
            }
        });
    });

})();
