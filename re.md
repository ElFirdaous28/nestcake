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
| 💻 GitHub Repository | `YOUR_GITHUB_URL` |

---

## ✨ Features

### For Customers
- Browse and search bakeries by event type, budget, location, dietary needs
- Submit open requests (multiple bakers can propose) or order directly from a profile
- Secure online payment via Stripe
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
| Backend | Node.js / Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Payment | Stripe |
| State Management | Redux / Context API |
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
git clone YOUR_GITHUB_URL
cd nestcake

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `.env` files in both `backend/` and `frontend/`:

**Backend `.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Run Locally

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Run with Docker

```bash
docker-compose up --build
```

---

## 🧪 Tests

Unit tests are written for every backend controller.

```bash
cd backend
npm test
```

---

## 📁 Project Structure

```
nestcake/
├── backend/
│   ├── controllers/
│   ├── middlewares/       # Auth (JWT), error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/
│   ├── tests/
│   └── server.js
├── frontend/
│   ├── app/               # Next.js app router
│   ├── components/
│   ├── store/             # Redux / Context
│   └── ...
├── docker-compose.yml
└── README.md
```

---

## 🔐 Security

- JWT authentication on all protected routes
- Route protection on both frontend and backend
- Stripe for secure payment processing
- Admin verification layer for professional profiles

---

## 📅 Project Timeline

| Phase | Duration |
|---|---|
| Design & Specifications | 1 week |
| Backend Development | 3–4 weeks |
| Frontend Development | 3–4 weeks |
| Mobile App | 3–4 weeks |
| Testing | 2 weeks |
| Deployment & Documentation | 1 week |

---

## 👤 Author

Built individually as part of the Fullstack JavaScript program (2025–2026).
Deadline: March 27, 2026.