<div align="center">

# 💰 EMI Calc Dashboard

### _Your Personal Finance Command Center_

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white)](https://trpc.io)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.44-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<br />

**A comprehensive, real-time personal finance tracker that gives you full visibility over your EMIs, income, expenses, and debt trajectory — all through an elegant, responsive dashboard.**

[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[Architecture](#-architecture) •
[Screenshots](#-pages--screenshots) •
[API Reference](#-api-reference) •
[Contributing](#-contributing)

</div>

---

## 🌟 Why EMI Calc Dashboard?

Managing multiple loans, tracking EMIs across different due dates, and keeping expenses in check can be overwhelming. **EMI Calc Dashboard** solves this by providing:

- 🎯 **One unified view** of all your financial obligations
- 📊 **Smart visualizations** — pie charts, bar graphs, trend lines, and calendar views
- 🔄 **Real-time EMI calculations** that auto-adjust as loans close
- 📅 **Month-by-month projections** so you always know what's coming
- ✅ **Payment tracking** with paid/pending/overdue status indicators
- 🏁 **Debt-free date prediction** to keep you motivated

---

## ✨ Features

### 📊 Dashboard
| Feature | Description |
|---------|-------------|
| **Key Metrics Cards** | Monthly EMI due, total outstanding, total income, net balance — all at a glance |
| **EMI Distribution Pie Chart** | Visual breakdown of EMI across all active loans |
| **EMI Bar Chart** | Side-by-side comparison of monthly EMI amounts per loan |
| **Payment Status Ring** | Paid vs pending vs overdue EMI indicators |
| **Account Balance Input** | Enter your current bank balance to see real net position |

### 💳 Loan Management
- **Detailed Loan Cards** with EMI amount, remaining count, outstanding balance, progress bar, and closing month
- **Full CRUD** — Add, edit, and delete loans with real-time database persistence
- **Extra Loan Tracking** — Track additional borrowings against existing loans
- **Status Management** — Mark loans as `active`, `closed`, or `paused`

### 📅 EMI Timeline & Calendar
- **Month-by-Month Timeline** — See exactly which EMIs are due each month with per-loan breakdown
- **Calendar View** — Visual calendar showing EMI due dates with color-coded status
- **Payment Tracking** — Mark individual EMIs as paid with actual payment date
- **Smart Status Calculation** — Auto-detects overdue EMIs based on current date

### 💵 Income & Expense Tracking
- **Income Categories**: Salary, Freelance, Bonus, Investment, Other
- **Expense Categories**: Food, Transport, Utilities, Entertainment, Healthcare, Shopping, Other
- **Daily Logging** with date, amount, category, and notes
- **Category Filtering & Breakdown** for detailed analysis

### 📈 Monthly Summary & Reports
- **Cash Flow Visualization** — Income vs EMI vs Expenses per month
- **Monthly Breakdown Table** — Detailed financial view per month
- **Net Balance Calculation** — `Income − EMI − Expenses` for each month

### 🏁 Debt Projection
- **Debt-Free Date Estimation** based on current loan data
- **Outstanding Balance Trajectory** — See how your total debt decreases over time
- **Loan Closure Timeline** — When each loan closes, month by month

### ✅ Payment Statistics
- **On-Time Rate** — Percentage of EMIs paid before due date
- **Late Payment Tracking** — Identify payment delay patterns
- **Paid/Pending/Overdue Counters** — Quick health check on your EMI discipline

---

## 🛠 Tech Stack

<table>
<tr>
<td align="center" width="150">

**Frontend**

</td>
<td>

| Technology | Version | Purpose |
|:--|:--|:--|
| React | 19 | UI Library |
| TypeScript | 5.9 | Type Safety |
| Tailwind CSS | 4 | Styling |
| Recharts | 2.15 | Charts & Visualizations |
| Framer Motion | 12 | Animations |
| shadcn/ui + Radix | Latest | Component Library |
| Wouter | 3 | Client-side Routing |
| React Hook Form + Zod | Latest | Form Handling & Validation |

</td>
</tr>
<tr>
<td align="center" width="150">

**Backend**

</td>
<td>

| Technology | Version | Purpose |
|:--|:--|:--|
| Express.js | 4 | HTTP Server |
| tRPC | 11 | End-to-End Typesafe API |
| Drizzle ORM | 0.44 | Database ORM & Migrations |
| MySQL | 8+ | Relational Database |
| Zod | 4 | Runtime Validation |
| Jose | 6 | JWT / OAuth |

</td>
</tr>
<tr>
<td align="center" width="150">

**Tooling**

</td>
<td>

| Technology | Version | Purpose |
|:--|:--|:--|
| Vite | 7 | Build Tool & Dev Server |
| Vitest | 2 | Unit Testing |
| pnpm | 10 | Package Manager |
| Drizzle Kit | 0.31 | DB Migration Generator |
| ESBuild | 0.25 | Server Bundling |
| Prettier | 3 | Code Formatting |

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10 (`npm install -g pnpm`)
- **MySQL** 8+ running locally or remotely

### 1. Clone the Repository

```bash
git clone https://github.com/Git-WarLord/EMI-Calc-Dashboard.git
cd EMI-Calc-Dashboard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL=mysql://username:password@localhost:3306/loan_tracker
```

### 4. Run Database Migrations

```bash
pnpm db:push
```

### 5. Seed Initial Data (Optional)

The project includes seed scripts with sample loan data:

```bash
node seed-loans-corrected.mjs
```

### 6. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173` (Vite frontend) proxied through the Express backend.

### Other Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build for production (Vite + ESBuild) |
| `pnpm start` | Run production server |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm check` | TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Generate & run DB migrations |

---

## 🏗 Architecture

```
EMI-Calc-Dashboard/
│
├── client/                     # Frontend (React SPA)
│   ├── index.html              # Entry HTML
│   ├── public/                 # Static assets
│   └── src/
│       ├── App.tsx             # Root component & router
│       ├── main.tsx            # React entry point
│       ├── index.css           # Global styles (Tailwind)
│       ├── const.ts            # Client constants
│       ├── components/         # Reusable UI components
│       │   ├── DashboardLayout.tsx
│       │   ├── AIChatBox.tsx
│       │   ├── ErrorBoundary.tsx
│       │   └── ui/             # shadcn/ui primitives
│       ├── contexts/           # React contexts (Theme)
│       ├── hooks/              # Custom hooks
│       ├── lib/                # Utilities (tRPC client)
│       └── pages/              # Route pages
│           ├── Dashboard.tsx       # 📊 Main overview
│           ├── Loans.tsx           # 💳 Loan management
│           ├── EMITimeline.tsx     # 📅 Month-by-month EMI
│           ├── EMICalendar.tsx     # 🗓️ Calendar view
│           ├── EMIPayments.tsx     # ✅ Payment tracking
│           ├── Income.tsx          # 💵 Income management
│           ├── Expenses.tsx        # 🛒 Expense tracking
│           ├── MonthlySummary.tsx   # 📈 Cash flow summary
│           ├── MonthlyBreakdown.tsx # 📋 Detailed breakdown
│           ├── DebtProjection.tsx   # 🏁 Debt-free projection
│           └── NotFound.tsx        # 404 page
│
├── server/                     # Backend (Express + tRPC)
│   ├── _core/                  # Server infrastructure
│   │   ├── index.ts            # Express server entry
│   │   ├── trpc.ts             # tRPC setup & procedures
│   │   ├── oauth.ts            # OAuth authentication
│   │   ├── context.ts          # Request context
│   │   ├── cookies.ts          # Session cookies
│   │   └── env.ts              # Environment config
│   ├── routers.ts              # All tRPC route definitions
│   ├── db.ts                   # Database queries & helpers
│   ├── storage.ts              # File storage utilities
│   └── data/                   # Static data files
│
├── shared/                     # Shared code (client + server)
│   ├── emiCalculator.ts        # 🧮 Core EMI schedule engine
│   ├── types.ts                # Shared type definitions
│   └── const.ts                # Shared constants
│
├── drizzle/                    # Database layer
│   ├── schema.ts               # Table definitions
│   ├── relations.ts            # Table relationships
│   ├── 0001_spotty_mauler.sql  # Initial migration
│   └── meta/                   # Migration metadata
│
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Test configuration
├── drizzle.config.ts           # Drizzle Kit config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies & scripts
└── pnpm-lock.yaml              # Lock file
```

---

## 🧮 EMI Calculation Engine

The heart of the application is the **shared EMI calculator** (`shared/emiCalculator.ts`), used by both frontend and backend to ensure **data consistency** across all pages.

### How It Works

```
┌─────────────────────────────────────────────────┐
│              Loan Data (from DB)                │
│  name, monthlyEMI, remainingEMIs, closesIn      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│        calculateStartingMonth()                  │
│  Works backward from closing month to find       │
│  the first EMI month                             │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│        generateLoanEMISchedule()                 │
│  Creates month-by-month entries for one loan     │
│  with amounts, due dates, and last-EMI flags     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│        mergeEMISchedules()                       │
│  Combines all loan schedules into a unified      │
│  monthly view sorted chronologically             │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│        generateDecoratedEMISchedule()            │
│  Overlays payment history → paid/pending/overdue │
│  Calculates exact due dates & status per EMI     │
└──────────────────────────────────────────────────┘
```

### Key Functions

| Function | Description |
|----------|-------------|
| `calculateMonthlyEMITotals()` | Get total EMI per month across all loans |
| `generateDecoratedEMISchedule()` | Full schedule with payment status overlay |
| `calculatePaymentStats()` | On-time rate, late rate, paid percentage |
| `getTotalOutstandingEMI()` | Sum of all remaining EMI payments |
| `getDebtFreeDate()` | When the last EMI will be paid |
| `getAverageMonthlyEMI()` | Average monthly EMI commitment |

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS ||--o{ LOANS : "has"
    USERS ||--o{ INCOME : "earns"
    USERS ||--o{ EXPENSES : "spends"
    USERS ||--o{ EMI_HISTORY : "pays"
    LOANS ||--o{ EMI_HISTORY : "tracked by"
    USERS ||--o{ MONTHLY_SUMMARY : "summarized"

    USERS {
        int id PK
        varchar openId UK
        text name
        varchar email
        varchar loginMethod
        enum role
        timestamp createdAt
        timestamp updatedAt
        timestamp lastSignedIn
    }

    LOANS {
        int id PK
        int userId FK
        varchar name
        decimal monthlyEMI
        int remainingEMIs
        decimal totalRemaining
        varchar dueDate
        varchar closesIn
        decimal extraLoan
        enum status
        timestamp createdAt
        timestamp updatedAt
    }

    EMI_HISTORY {
        int id PK
        int loanId FK
        int userId FK
        decimal amount
        date dueDate
        date paidDate
        enum status
        timestamp createdAt
        timestamp updatedAt
    }

    INCOME {
        int id PK
        int userId FK
        varchar category
        decimal amount
        date date
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    EXPENSES {
        int id PK
        int userId FK
        varchar category
        decimal amount
        date date
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    MONTHLY_SUMMARY {
        int id PK
        int userId FK
        varchar month
        decimal totalEMI
        decimal totalIncome
        decimal totalExpenses
        int activeLoans
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## 🔌 API Reference

All APIs are type-safe via **tRPC**. The router is defined in `server/routers.ts`.

### Authentication

| Endpoint | Type | Description |
|----------|------|-------------|
| `auth.me` | Query | Get current authenticated user |
| `auth.logout` | Mutation | Clear session and log out |

### Loans

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `loans.list` | Query | — | Get all loans for the user |
| `loans.get` | Query | `{ id }` | Get a specific loan by ID |
| `loans.create` | Mutation | `{ name, monthlyEMI, remainingEMIs, ... }` | Create a new loan |
| `loans.update` | Mutation | `{ id, ...fields }` | Update loan details |
| `loans.delete` | Mutation | `{ id }` | Delete a loan |

### Income

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `income.list` | Query | — | Get all income entries |
| `income.create` | Mutation | `{ category, amount, date, notes? }` | Add income entry |
| `income.update` | Mutation | `{ id, ...fields }` | Update income entry |
| `income.delete` | Mutation | `{ id }` | Delete income entry |

### Expenses

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `expenses.list` | Query | — | Get all expenses |
| `expenses.create` | Mutation | `{ category, amount, date, notes? }` | Add expense entry |
| `expenses.update` | Mutation | `{ id, ...fields }` | Update expense entry |
| `expenses.delete` | Mutation | `{ id }` | Delete expense entry |

### Dashboard

| Endpoint | Type | Description |
|----------|------|-------------|
| `dashboard.summary` | Query | Key metrics (totalEMI, outstanding, income, expenses, netBalance) |
| `dashboard.monthlyBreakdown` | Query | Month-by-month income/EMI/expense data for charts |

### EMI History

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `emi.list` | Query | — | Get all EMI payment history |
| `emi.markPaid` | Mutation | `{ loanId, dueDate, paidDate, amount }` | Mark an EMI as paid |
| `emi.markUnpaid` | Mutation | `{ loanId, dueDate }` | Revert an EMI to unpaid |

---

## 📱 Pages & Screenshots

The application features **10 fully functional pages**, each accessible from the sidebar navigation:

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | **Dashboard** | `/` | Overview with key metrics, pie charts, bar graphs, and payment status |
| 2 | **Loans** | `/loans` | All loans displayed as cards with progress bars and CRUD operations |
| 3 | **EMI Timeline** | `/emi-timeline` | Month-by-month EMI schedule with per-loan breakdown |
| 4 | **EMI Calendar** | `/emi-calendar` | Calendar view with color-coded EMI due dates |
| 5 | **EMI Payments** | `/emi-payments` | Payment tracking with mark-as-paid functionality |
| 6 | **Income** | `/income` | Income management with category breakdowns |
| 7 | **Expenses** | `/expenses` | Daily expense logging with category filtering |
| 8 | **Monthly Summary** | `/monthly-summary` | Cash flow visualization (Income vs EMI vs Expenses) |
| 9 | **Monthly Breakdown** | `/monthly-breakdown` | Detailed month-by-month financial table |
| 10 | **Debt Projection** | `/debt-projection` | Debt trajectory and estimated debt-free date |

---

## 📐 Responsive Design

The application is fully responsive across all breakpoints:

| Viewport | Width | Optimizations |
|----------|-------|---------------|
| 📱 **Mobile** | 375px – 480px | Stacked layouts, collapsed sidebar, touch-friendly controls |
| 📱 **Tablet** | 768px – 1024px | Adaptive grid, compact charts, responsive tables |
| 💻 **Desktop** | 1280px+ | Full sidebar, multi-column grids, expanded visualizations |

---

## 🧪 Testing

The project uses **Vitest** for unit testing:

```bash
# Run all tests
pnpm test

# Tests include:
# - EMI calculation accuracy
# - Auth logout flow
# - API endpoint validation
```

Test files:
- `server/emi.test.ts` — EMI calculation engine tests
- `server/auth.logout.test.ts` — Authentication logout tests

---

## 🗂 Pre-seeded Loan Data

The application ships with seed scripts containing **9 real-world loan entries**:

| # | Loan | Monthly EMI (₹) | Due Date | Closes |
|---|------|-----------------|----------|--------|
| 1 | OneCard (CC) | 4,125 | 5th | Nov 2026 |
| 2 | OneCard Fridge | 2,708 | 5th | Oct 2026 |
| 3 | Fibe | 5,646 | 9th | Sep 2026 |
| 4 | KreditBee | 4,651 | 14th | Apr 2027 |
| 5 | Kotak Mahindra | 4,649 | 1st | Nov 2026 |
| 6 | mPokket | 1,893 | 25th | Dec 2026 |
| 7 | mMoney | 12,910 | 21st | Jul 2026 |
| 8 | Navi | 4,300 | 5th | Oct 2027 |
| 9 | Bike | 7,818 | 5th | Jun 2028 |

---

## 🔐 Security

- **OAuth Authentication** — Secure login with session-based cookie management
- **User Isolation** — All data is scoped per-user; users can only access their own records
- **Protected Procedures** — All data-modifying tRPC endpoints require authentication
- **Input Validation** — Every API input is validated with Zod schemas at runtime

---

## 🗺️ Roadmap

- [ ] 📤 Export reports (PDF / Excel)
- [ ] 🔔 EMI due date reminders & push notifications
- [ ] 💰 Budget planning with category-wise limits
- [ ] 📊 Investment tracking & net worth calculator
- [ ] 📱 Progressive Web App (PWA) support
- [ ] 🤖 AI-powered spending insights
- [ ] 🔄 Bank statement import (CSV/OFX)
- [ ] 👥 Multi-user family finance management

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your code:
- Passes `pnpm check` (TypeScript)
- Passes `pnpm test` (Vitest)
- Is formatted with `pnpm format` (Prettier)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [git-warlord](https://github.com/Git-WarLord)**

React • TypeScript • Tailwind CSS • tRPC • Drizzle ORM • MySQL

⭐ **Star this repo if you found it useful!** ⭐

</div>
