# 🎂 NestCake

> A platform connecting customers with local bakeries and independent cake creators for personalized cake orders.

---

## 📌 Overview

NestCake solves a real gap: finding quality, personalized cakes nearby is hard for customers, and small cake businesses struggle to reach a local audience beyond social media. NestCake bridges that gap with a dedicated marketplace for custom cake orders — weddings, birthdays, events, and more.

Built as a fullstack JavaScript project (2025–2026 program).

---

## 🔗 Links

| Resource | URL |
|---|---|
| 🌐 Frontend (deployed) | `YOUR_FRONTEND_URL` |
| ⚙️ Backend API (deployed) | `YOUR_BACKEND_URL` |
| 🎨 Figma Design | `YOUR_FIGMA_URL` |
| 🖼️ Canva Presentation | `YOUR_CANVA_URL` |

---

## ✨ Features

### For Customers
- Browse and search bakeries by event type, budget, location(futur feature), dietary needs
- Submit open requests (multiple bakers can propose) or order directly from a profile
- Secure online payment via Stripe(futur feature),
- Leave reviews and save favorite bakeries

### For Bakers & Cake Businesses
- Create a verified professional profile with portfolio photos
- Receive and manage incoming orders
- Update availability and run promotions
- View customer reviews

### For Admins
- Verify professional profiles and content
- Manage users, orders, and payments

---

## 🔄 Order Workflow

```
Customer submits request
       ↓
Professionals send proposals
       ↓
Customer accepts → Order created (AWAITING_PAYMENT)
       ↓
Customer pays 100% (held in escrow) → Status: IN_PROGRESS
       ↓
Professional marks order READY
       ↓
Customer confirms reception
       ↓
Platform releases payment → (Optional) Customer leaves review
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Backend | Node.js / NestJs|
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Payment | Stripe |
| State Management | Context API |
| Containerization | Docker |
| CI/CD | GitHub Actions Pipeline |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Docker (optional)


### Installation

```bash
# Clone the repo
git clone https://github.com/ElFirdaous28/nestcake
cd nestcake

# Install all dependencies (monorepo — run from root)
pnpm install
```

### Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Then fill in your values in each file.


### Run Locally

```bash
# Run both apps in parallel from the root
pnpm dev

# Or run individually
pnpm --filter api start:dev       # NestJS API  → http://localhost:5000
pnpm --filter web dev       # Next.js web → http://localhost:3000
```

### Seed the Database

```bash
pnpm --filter api seed
```

### Run with Docker

```bash
docker-compose up --build
```

---

## 🧪 Tests

Unit tests cover every controller in the API.

```bash
# Run all tests
pnpm --filter api test
```

---

## 📁 Project Structure

```
nestcake/
├── apps/
│   ├── api/                        # NestJS backend
│   │   └── src/
│   │       ├── auth/               # JWT auth, guards, decorators
│   │       ├── users/
│   │       ├── professionals/      # Baker profiles & verification
│   │       ├── products/           # Cake catalog
│   │       ├── requests/           # Open customer requests
│   │       ├── proposals/          # Baker proposals on requests
│   │       ├── orders/
│   │       ├── payments/           # Stripe integration
│   │       ├── reviews/
│   │       ├── notifications/      # WebSocket gateway
│   │       ├── categories/
│   │       ├── allergies/
│   │       └── seed/               # Database seeders
│   └── web/                        # Next.js frontend
│       ├── app/
│       │   ├── (auth)/             # Login, Register
│       │   ├── (protected)/
│       │   │   ├── admin/          # Admin dashboard
│       │   │   ├── client/         # Customer dashboard
│       │   │   └── professional/   # Baker dashboard
│       │   └── products/           # Public catalog
│       └── src/
│           ├── components/
│           ├── contexts/           # AuthContext, SocketContext
│           ├── hooks/              # useOrders, useRequests, etc.
│           └── services/           # API service layer
├── packages/
│   └── shared-types/               # Enums & types shared across apps
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```