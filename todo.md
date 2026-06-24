# Loan & Expense Tracker - Project TODO

## Phase 1: Data Models & Schema
- [x] Analyze Excel data and extract loan details
- [x] Design database schema (loans, EMIs, income, expenses tables)
- [x] Create Drizzle ORM schema definition
- [x] Generate and apply database migration

## Phase 2: Backend API
- [x] Create loans CRUD endpoints (list, get, create, update, delete)
- [x] Create EMI management endpoints
- [x] Create income management endpoints (add, edit, delete, list)
- [x] Create expense tracking endpoints (add, edit, delete, list, filter)
- [x] Create monthly summary calculation endpoint
- [x] Add database seeding logic for initial 9 loans

## Phase 3: Frontend Dashboard & Layout
- [x] Set up DashboardLayout with sidebar navigation
- [x] Design and implement main dashboard page with key metrics
- [x] Implement EMI trend line chart (Recharts)
- [x] Implement expense breakdown pie chart (Recharts)
- [x] Implement monthly cash-flow bar chart (Recharts)
- [x] Create responsive grid layout for dashboard cards

## Phase 4: Loan Management UI
- [x] Build loan list page with detailed loan cards
- [x] Implement loan progress bars
- [x] Add loan creation/edit modal
- [x] Add loan deletion with confirmation
- [x] Build month-by-month EMI timeline view
- [x] Implement date-wise EMI calendar view

## Phase 5: Income Management
- [x] Build income entry form (category, amount, date)
- [x] Create income list view with filters
- [x] Implement income edit/delete functionality
- [x] Add monthly income summary display

## Phase 6: Expense Tracking
- [x] Build daily expense entry form (category, amount, date, notes)
- [x] Create expense list view with day/week/month filters
- [x] Implement expense edit/delete functionality
- [x] Add expense category breakdown
- [x] Create monthly expense summary

## Phase 7: Monthly Summary & Reports
- [x] Build monthly summary page showing income, EMI, expenses, balance
- [x] Implement month-by-month comparison view
- [x] Add debt payoff projection

## Phase 8: Data Seeding & Testing
- [x] Parse Excel data and seed initial 9 loans
- [x] Verify all loan data is correctly loaded
- [x] Test all CRUD operations
- [x] Test chart rendering with real data

## Phase 9: Polish & Responsive Design
- [x] Test responsive design on mobile/tablet/desktop
- [x] Optimize animations and interactions
- [x] Verify all forms and inputs work smoothly
- [x] Final UI polish and refinement
- [x] Create checkpoint and prepare for delivery

## Additional Enhancements
- [x] Add debt payoff projection with estimated debt-free date
- [x] Implement real-time monthly EMI calculation based on actual dates
- [x] Add tablet viewport testing (768px)
- [x] Implement smooth page transitions and micro-interactions


## Bug Fixes & Improvements
- [x] Fix EMI Timeline to show accurate month-by-month totals (not just closing months)
- [x] Calculate total EMI needed for each month based on actual EMI due dates and remaining EMIs
- [x] Create new Monthly Breakdown page showing total EMI + expenses per month
- [x] Add expense tracking to monthly breakdown view


## Critical Fixes - Data Accuracy & Consistency
- [x] Create shared EMI schedule calculator utility that generates accurate month-by-month EMI entries
- [x] EMI Timeline must recalculate in real-time when loan data changes
- [x] Ensure all pages (Dashboard, Monthly Breakdown, Debt Projection) use same EMI calculation
- [x] Add backend endpoint to calculate accurate monthly EMI totals
- [x] Test EMI calculations with actual loan data to verify accuracy
- [x] Monthly Breakdown must sync with EMI Timeline calculations
- [x] Dashboard charts must reflect real-time EMI data changes


## Data Correction - July 2026 Start Date
- [x] Clear all existing loan data from database
- [x] Add extraLoan field to loans table schema
- [x] Update loan seeding script with corrected data (9 loans with accurate EMIs and due dates)
- [x] Set all loans to start from July 2026
- [x] Verify EMI calculations start from July 2026 in all pages
- [x] Test EMI Timeline shows correct months starting July 2026
- [x] Test Monthly Breakdown shows accurate totals from July 2026
- [x] Test Debt Projection shows correct debt-free date
- [x] Ensure all pages reflect synchronized, accurate data


## EMI Payment Tracking Feature
- [x] Create backend API endpoints for marking EMIs as paid/unpaid
- [x] Build EMI payment history page showing all payments with status
- [x] Add mark-as-paid functionality with date picker
- [x] Display payment status in Dashboard (paid/pending/overdue)
- [x] Show payment indicators in EMI Timeline
- [x] Add payment history to each loan detail view
- [x] Calculate on-time vs late payment statistics
- [x] Test payment tracking across all pages
