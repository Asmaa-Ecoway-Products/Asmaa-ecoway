// data/products.js
const PRODUCTS_DATA = {
  categories: {
    home: {
      id: "home",
      name: "فوط التنظيف والمنزل",
      nameAr: "فوط التنظيف ومنتجات المنزل",
      icon: "ph-fill ph-towel",
      color: "brand",
      bgGradient: "linear-gradient(135deg, #e3f2e1 0%, #c8e6c9 50%, #a5d6a7 100%)",
      pageUrl: "pages/fout-el-tanfeef.html",
      description: "اكتشفي مجموعتنا المتميزة من فوط المايكروفايبر عالية الجودة",
      tags: ["قابلة للغسيل", "لا تخدش الأسطح"]
    },
    skin: {
      id: "skin",
      name: "تنظيف البشرة",
      nameAr: "منتجات العناية بالبشرة",
      icon: "ph-fill ph-sparkle",
      color: "pink",
      bgGradient: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)",
      pageUrl: "pages/skin-care.html",
      description: "جمال بشرتك يبدأ باختيار آمن",
      tags: ["مكونات طبيعية", "مناسب لجميع أنواع البشرة"]
    },
    perfume: {
      id: "perfume",
      name: "شنط وعطور",
      nameAr: "منتجات العطور والشنط",
      icon: "ph-fill ph-gem",
      color: "yellow",
      bgGradient: "linear-gradient(135deg, #fff8e1 0%, #ffecb3 50%, #ffe082 100%)",
      pageUrl: "pages/perfumes-bags.html",
      description: "عطر يعبّر عنك… وثبات يدوم طوال اليوم",
      tags: ["عطور أصلية", "هدايا فاخرة"]
    },
    natural: {
      id: "natural",
      name: "منظفات طبيعية وصابون",
      nameAr: "منتجات المنظفات الطبيعية",
      icon: "ph-fill ph-leaf",
      color: "green",
      bgGradient: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)",
      pageUrl: "pages/natural-products.html",
      description: "اختاري النظافة الطبيعية القوية… بدون كيماويات مؤذية",
      tags: ["100% طبيعي", "خالي من المواد الحافظة"]
    },
    packages: {
      id: "packages",
      name: "الباكدجات",
      nameAr: "الباكدجات المميزة",
      icon: "ph-fill ph-gift",
      color: "green",
      bgGradient: "linear-gradient(135deg, #d4e6d4 0%, #b8d9b0 50%, #9cc09c 100%)",
      pageUrl: "pages/packages.html",
      description: "اختاري الأفضل بقيمة أحلى – وفرى أكتر",
      tags: ["توفير", "منتجات مجمعة"]
    }
  },
  
  products: [
    {
      id: 1,
      name: "الفوطة الدبل فيس",
      price: 384,
      originalPrice: null,
      category: "home",
      rating: 5,
      reviews: 42,
      images: ["assets/images/prod/1.jpeg"],
      videoUrl: null,
      description: "فوطة مايكروفايبر كبيرة الحجم، مثالية لتنظيف جميع الأسطح",
      features: ["قابلة للغسيل", "لا تخدش الأسطح", "عالي الامتصاص"],
      inStock: true,
      featured: true
    },
    {
      id: 2,
      name: "فوطة التراب",
      price: 240,
      originalPrice: null,
      category: "home",
      rating: 5,
      reviews: 38,
      images: ["assets/images/prod/222.jpeg"],
      videoUrl: null,
      description: "فوطة متوسطة الحجم لجمع الأتربة بكفاءة",
      features: ["يجمع الأتربة", "سهل التنظيف"],
      inStock: true,
      featured: true
    },
    // ... المزيد من المنتجات
  ]
};

// تصدير البيانات
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRODUCTS_DATA;
}