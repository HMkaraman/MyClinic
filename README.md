# MyClinic - نظام إدارة العيادات الطبية

<div align="center">

![MyClinic Logo](./docs/assets/logo.png)

**منصة موحدة لإدارة العيادات الطبية متعددة التخصصات مع الذكاء الاصطناعي**

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)]()
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)]()

[العربية](#العربية) | [English](#english) | [کوردی](#کوردی) | [Kurmancî](#kurmancî)

</div>

---

## العربية

### 🎯 نظرة عامة

MyClinic هو نظام متكامل لإدارة العيادات الطبية يجمع بين:
- **التشغيل اليومي**: إدارة المرضى، المواعيد، الزيارات، والملفات الطبية
- **إدارة علاقات العملاء (CRM)**: تتبع رحلة المريض من أول استفسار حتى المتابعة
- **صندوق وارد موحد**: جمع جميع قنوات التواصل في مكان واحد
- **نظام مالي**: فواتير، مدفوعات، مصروفات، وتقارير شاملة
- **ذكاء اصطناعي مدمج**: وكيل عملاء للرد على الاستفسارات + مساعد داخلي للموظفين

### 🚀 البدء السريع

#### المتطلبات الأساسية
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16 (عبر Docker)
- Redis 7 (عبر Docker)

#### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/your-org/myclinic.git
cd myclinic

# تثبيت التبعيات
pnpm install

# نسخ ملف البيئة
cp .env.example .env

# تشغيل قاعدة البيانات والخدمات
docker compose -f docker/docker-compose.yml up -d

# تطبيق migrations
pnpm db:migrate

# تشغيل التطبيق
pnpm dev
```

#### الوصول
- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **MinIO Console**: http://localhost:9001

### 📁 بنية المشروع

```
MyClinic/
├── apps/
│   ├── web/                # Next.js Frontend
│   └── api/                # NestJS Backend
├── packages/
│   ├── types/              # TypeScript types المشتركة
│   ├── i18n/               # الترجمات (عربي، إنجليزي، كردي)
│   ├── config/             # إعدادات ESLint و TypeScript
│   └── ui/                 # مكونات UI المشتركة
├── docker/                 # ملفات Docker
└── docs/                   # التوثيق
```

### 🌐 اللغات المدعومة
- 🇮🇶 العربية (الأساسية)
- 🇬🇧 الإنجليزية
- 🇮🇶 الكردية السورانية
- 🇹🇷 الكردية البادينية (كرمانجي)

### 📜 الأوامر المتاحة

```bash
# التطوير
pnpm dev              # تشغيل web و api معاً
pnpm build            # بناء المشروع
pnpm lint             # فحص الكود
pnpm lint:fix         # إصلاح مشاكل الكود
pnpm format           # تنسيق الكود

# قاعدة البيانات
pnpm db:generate      # توليد Prisma Client
pnpm db:migrate       # تطبيق Migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # فتح Prisma Studio

# الاختبارات
pnpm test             # تشغيل الاختبارات
pnpm test:e2e         # اختبارات E2E
```

### 👥 الأدوار والصلاحيات

| الدور | الوصف |
|-------|-------|
| ADMIN | مدير النظام - كل الصلاحيات |
| MANAGER | مدير العيادة/الفرع |
| RECEPTION | الاستقبال والحجوزات |
| DOCTOR | الطبيب |
| NURSE | الممرض/المساعد |
| ACCOUNTANT | المحاسب |
| SUPPORT | خدمة العملاء/المبيعات |

---

## English

### 🎯 Overview

MyClinic is a comprehensive medical clinic management system that combines:
- **Daily Operations**: Patient management, appointments, visits, and medical records
- **CRM**: Track patient journey from inquiry to follow-up
- **Unified Inbox**: All communication channels in one place
- **Financial System**: Invoices, payments, expenses, and comprehensive reports
- **AI Integration**: Customer agent for inquiries + internal staff assistant

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/myclinic.git
cd myclinic

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start database and services
docker compose -f docker/docker-compose.yml up -d

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

<div align="center">

**Built with ❤️ for Healthcare**

Next.js • NestJS • PostgreSQL • Prisma • Redis • Tailwind CSS

</div>
