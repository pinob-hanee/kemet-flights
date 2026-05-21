# Kemet Flights ✈️

> A GoToGate-style flight booking platform built with Egyptian aesthetics — powered by the **Duffel API**.

![Kemet Flights](https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80)

## ✨ Features

- 🔍 **Real-time flight search** via Duffel API (60+ results in seconds)
- ✈️ **One-way & Round-trip** booking with cabin class selection
- 👥 **Multi-passenger** support (adults, children, infants)
- 🏷️ **Filter & Sort** by stops, price, airline
- 💳 **Passenger checkout** with real Duffel order creation
- 🔐 **JWT Authentication** (register, login, refresh tokens)
- 🎨 **Egyptian pharaonic design** — gold, nile blue, sand palette
- 📱 **Responsive** — works on mobile, tablet, desktop
- 🌐 **PWA-ready** with manifest.json

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React + Vite | UI framework |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| Zustand | State management |
| Axios | HTTP client |
| Lucide React | Icons |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | API server |
| TypeScript | Type safety |
| Prisma ORM | Database access |
| PostgreSQL | Primary database |
| Argon2 | Password hashing |
| JWT | Authentication |
| Winston | Logging |
| Duffel SDK | Flight data & booking |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- [Duffel account](https://app.duffel.com) (free test key)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/kemet-flights.git
cd kemet-flights
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and Duffel API key
npx prisma migrate dev
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🔑 Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `DUFFEL_API_KEY` | Your Duffel test or live API key |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | — | Register new user |
| `POST` | `/api/v1/auth/login` | — | Login, get JWT |
| `POST` | `/api/v1/flights/search` | — | Search flights |
| `GET` | `/api/v1/flights/offers` | — | List offers |
| `GET` | `/api/v1/flights/airports?q=` | — | Airport autocomplete |
| `POST` | `/api/v1/flights/book` | ✅ JWT | Confirm booking |
| `GET` | `/api/v1/flights/orders/:id` | ✅ JWT | Get order |
| `GET` | `/health` | — | Health check |

---

## 📁 Project Structure

```
kemet-flights/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Duffel API integration
│   │   ├── routes/          # Express routers
│   │   ├── middlewares/     # Auth, error handling
│   │   ├── config/          # DB connection
│   │   └── utils/           # Logger
│   └── prisma/
│       └── schema.prisma    # Database schema
└── frontend/
    └── src/
        ├── pages/           # Home, Flights, Checkout, Dashboard
        ├── components/      # Navbar, Footer, AIConcierge
        ├── store/           # Zustand state
        └── lib/             # Axios instance
```

---

## 📜 License

MIT © 2026 Kemet Flights
