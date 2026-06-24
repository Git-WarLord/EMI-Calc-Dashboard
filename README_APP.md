# Loan & Expense Tracker - Complete Application Guide

## Overview

The **Loan & Expense Tracker** is a comprehensive personal finance management application built with React, Express, Drizzle ORM, and MySQL. It provides complete visibility over your EMIs, income, and daily expenses through an elegant, responsive dashboard.

## Features

### 1. **Dashboard**
- **Key Metrics**: Monthly EMI due, total outstanding balance, total income, and net balance
- **EMI Distribution Chart**: Pie chart showing EMI breakdown across all loans
- **EMI Amount by Loan**: Bar chart displaying monthly EMI for each active loan
- **Active Loans Summary**: Quick view of all active loans with key details

### 2. **Loan Management**
- **Pre-seeded Data**: All 9 loans from your Excel file are automatically loaded
- **Loan Cards**: Display each loan with:
  - Monthly EMI amount
  - Remaining EMIs count
  - Total outstanding balance
  - Progress bar showing payoff progress
  - Due date and closing month
- **CRUD Operations**: Add, edit, or delete loans directly from the app
- **Real-time Updates**: All changes are persisted to the database

### 3. **Income Tracking**
- **Income Categories**: Salary, Freelance, Bonus, Investment, Other
- **Add/Edit/Delete**: Manage all income entries with date and notes
- **Monthly Totals**: View total income by category
- **Summary View**: Quick overview of income sources

### 4. **Expense Tracking**
- **Expense Categories**: Food, Transport, Utilities, Entertainment, Healthcare, Shopping, Other
- **Daily Logging**: Record expenses with amount, date, category, and notes
- **Category Filtering**: Filter expenses by category for detailed analysis
- **Breakdown View**: See spending distribution across categories
- **Monthly Summary**: Track total expenses by month

### 5. **Monthly Summary**
- **Cash Flow Chart**: Visual representation of monthly income, EMI, and expenses
- **Monthly Breakdown Table**: Detailed view of each month's finances
- **Balance Calculation**: Net balance (Income - EMI - Expenses) for each month
- **Summary Statistics**: Total income, EMI, expenses, and net balance across all months

## Technology Stack

- **Frontend**: React 19, Tailwind CSS 4, Recharts
- **Backend**: Express.js, tRPC 11
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth
- **UI Components**: shadcn/ui

## Database Schema

### Tables

1. **users** - User accounts and authentication
2. **loans** - Loan information (name, EMI, remaining EMIs, due date, etc.)
3. **income** - Income entries (category, amount, date)
4. **expenses** - Expense entries (category, amount, date, notes)
5. **emiHistory** - Historical EMI payment tracking
6. **monthlySummary** - Pre-calculated monthly summaries

## API Endpoints (tRPC)

### Loans
- `loans.list` - Get all loans for the user
- `loans.get` - Get a specific loan
- `loans.create` - Create a new loan
- `loans.update` - Update loan details
- `loans.delete` - Delete a loan

### Income
- `income.list` - Get all income entries
- `income.create` - Add new income
- `income.update` - Update income entry
- `income.delete` - Delete income entry

### Expenses
- `expenses.list` - Get all expenses
- `expenses.create` - Add new expense
- `expenses.update` - Update expense entry
- `expenses.delete` - Delete expense entry

### Dashboard
- `dashboard.summary` - Get key metrics
- `dashboard.monthlyBreakdown` - Get monthly data for charts

## Pre-seeded Data

The application comes with 9 loans automatically loaded from your Excel file:

1. **OneCard (CC)** - ₹4,125/month, 5 EMIs, Closes Nov 2025
2. **OneCard Fridge** - ₹2,708/month, 4 EMIs, Closes Oct 2025
3. **Fibe** - ₹5,646/month, 3 EMIs, Closes Sep 2025
4. **KreditBee** - ₹4,651/month, 10 EMIs, Closes Apr 2026
5. **Kotak Mahindra** - ₹4,649/month, 5 EMIs, Closes Nov 2025
6. **mPokket** - ₹1,893/month, 6 EMIs, Closes Dec 2025
7. **mMoney** - ₹12,910/month, 1 EMI, Closes Jul 2025
8. **Navi** - ₹4,300/month, 16 EMIs, Closes Oct 2026
9. **Bike** - ₹7,818/month, 24 EMIs, Closes Jun 2028

**Total Monthly EMI**: ₹48,700

## Responsive Design

The application is fully responsive and works seamlessly on:
- **Desktop** (1280px and above)
- **Tablet** (768px - 1024px)
- **Mobile** (375px - 480px)

All pages automatically adapt to different screen sizes with optimized layouts.

## User Guide

### Getting Started

1. **Sign In**: Use Manus OAuth to authenticate
2. **View Dashboard**: See your financial overview with key metrics and charts
3. **Explore Loans**: Check all your loans with detailed information
4. **Track Income**: Add your income sources and track monthly totals
5. **Log Expenses**: Record daily expenses and analyze spending patterns
6. **Review Summary**: Check monthly cash flow and financial balance

### Adding a Loan

1. Go to **Loans** page
2. Click **Add Loan** button
3. Fill in loan details:
   - Loan name
   - Monthly EMI amount
   - Remaining EMIs count
   - Total outstanding balance
   - Due date (day of month)
   - Closing month
4. Click **Add Loan** to save

### Recording Income

1. Go to **Income** page
2. Click **Add Income** button
3. Select income category
4. Enter amount and date
5. Add optional notes
6. Click **Add Income** to save

### Logging Expenses

1. Go to **Expenses** page
2. Click **Add Expense** button
3. Select expense category
4. Enter amount and date
5. Add optional notes
6. Click **Add Expense** to save

### Viewing Monthly Summary

1. Go to **Monthly Summary** page
2. View the cash flow chart showing income, EMI, and expenses by month
3. Check the breakdown table for detailed monthly finances
4. Review summary statistics at the bottom

## Data Persistence

All data is automatically saved to the MySQL database. Your loans, income, and expenses are persisted and available every time you log in.

## Security

- **Authentication**: Manus OAuth ensures secure login
- **User Isolation**: Each user's data is isolated and private
- **Database**: All sensitive data is stored securely in MySQL

## Future Enhancements

Potential features for future releases:
- Debt payoff projection with estimated debt-free date
- Budget planning and alerts
- Export reports (PDF, Excel)
- Mobile app version
- Bill reminders and notifications
- Investment tracking
- Net worth calculation

## Support

For issues or questions, please contact the development team or submit feedback through the application.

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Built with**: React, Express, Drizzle ORM, MySQL, Tailwind CSS
