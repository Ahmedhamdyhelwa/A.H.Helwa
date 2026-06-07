# A.H.Helwa ERP

نظام سحابي متكامل (SaaS) لإدارة الحسابات والمبيعات والمخزون، يناسب:

- 💊 الصيدليات
- 🍽️ المطاعم والكافيهات
- 🛒 السوبر ماركت والمحلات التجارية
- 👕 محلات الملابس والأجهزة والإلكترونيات

## التقنيات

- **Next.js 14** (App Router) + **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **Tailwind CSS** + **Lucide Icons** + **Recharts**
- **JWT** (jose) + **bcryptjs** + **Zod**
- Architecture: Multi-tenant SaaS, RBAC, REST API, RTL Arabic-first UI

## الموديولات (MVP — المرحلة الأولى)

| الموديول | المحتوى |
|---|---|
| 🛒 المبيعات | POS، باركود، خصومات، VAT، طباعة، عميل نقدي/آجل |
| 🚚 المشتريات | فواتير شراء، موردين، مرتجعات، تحديث التكلفة |
| 📦 المخزون | أصناف، فئات، حد إعادة الطلب، حركات، تاريخ صلاحية للصيدليات |
| 👥 العملاء والموردون | إدارة، أرصدة، سجل معاملات |
| 💰 الحسابات | الخزنة، البنك، سندات قبض/صرف، مصروفات |
| 📊 التقارير | مبيعات/مشتريات/ربح، أكثر مبيعاً، تنبيهات المخزون |
| ⚙️ الإعدادات | الفروع، المستخدمون، الصلاحيات |
| 📈 لوحة التحكم | KPIs ورسوم بيانية لآخر 7 أيام |

## الصلاحيات (RBAC)

| الدور | الوصف |
|---|---|
| OWNER | مالك النشاط — صلاحيات كاملة |
| MANAGER | مدير — كل شيء عدا الإعدادات الحساسة |
| CASHIER | كاشير — المبيعات فقط |
| ACCOUNTANT | محاسب — الحسابات والتقارير |
| STOCK_KEEPER | موظف مخزن — المخزون والمشتريات |

## التشغيل

### 1) المتطلبات
- Node.js 20+
- PostgreSQL 14+

### 2) الإعداد
```bash
cp .env.example .env
# عدّل DATABASE_URL و JWT_SECRET
npm install
npx prisma generate
npx prisma db push     # أو: npx prisma migrate dev
npm run db:seed        # ينشئ منشأة تجريبية
npm run dev
```

افتح http://localhost:3000

### بيانات الدخول التجريبية
- **Slug**: `demo`
- **Email**: `admin@demo.com`
- **Password**: `admin123`

## بنية المشروع

```
src/
├── app/
│   ├── (app)/              # المنطقة المحمية (تتطلب تسجيل دخول)
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── inventory/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── accounting/
│   │   ├── expenses/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/                # REST endpoints
│   │   ├── auth/{login,register,logout}
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── payments/
│   │   ├── expenses/
│   │   └── users/
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── components/             # UI components مشتركة
├── lib/
│   ├── auth.ts             # JWT sessions
│   ├── prisma.ts           # Prisma client singleton
│   ├── rbac.ts             # Roles & permissions
│   ├── utils.ts            # formatters
│   └── services/           # business logic (sales, purchases)
└── middleware.ts           # حماية الصفحات
prisma/
├── schema.prisma           # نموذج البيانات الكامل
└── seed.ts
```

## نموذج البيانات (Highlights)

- **Tenant** هو العمود الفقري للـ SaaS — كل صف في كل جدول يحمل `tenantId`.
- **Branch** يدعم تعدد الفروع.
- **ProductStock** يحفظ الرصيد لكل صنف × فرع.
- **StockMovement** يسجل كل حركة (شراء/بيع/تسوية/تحويل/مرتجع) لـ audit كامل.
- **SalesInvoice / PurchaseInvoice** بنود مفصلة مع ضريبة وخصم على البند والفاتورة.
- **Account / Payment / Expense** يشكلون نواة الحسابات والخزينة.

## المرحلة الثانية (Roadmap)

- 📱 تطبيق موبايل (React Native / Expo)
- 🖥️ نقاط بيع POS مع أجهزة طرفية
- 📷 باركود متقدم وطباعة ملصقات
- 💬 WhatsApp Integration للفواتير والتنبيهات
- 🤖 AI Analytics للتنبؤ بالمبيعات والمخزون
- 🔔 تنبيهات ذكية (انتهاء صلاحية / نفاد مخزون / متأخرات)
- 🍽️ مطاعم: إدارة طاولات + Kitchen Display + Delivery
- 🏢 تعدد الفروع المتقدم (نقل مخزون مع موافقات + تقارير مجمعة)
- 💳 اشتراكات SaaS مدفوعة (Stripe / Fawry / Paymob)

## النشر السحابي

النظام جاهز للنشر على:
- **Vercel** (للـ frontend + API)
- **Neon / Supabase / Railway** (لـ PostgreSQL)
- أو أي PaaS يدعم Node.js + Postgres
