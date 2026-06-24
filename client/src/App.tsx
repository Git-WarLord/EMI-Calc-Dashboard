import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Loans from "./pages/Loans";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import MonthlySummary from "./pages/MonthlySummary";
import DebtProjection from "./pages/DebtProjection";
import EMITimeline from "./pages/EMITimeline";
import EMICalendar from "./pages/EMICalendar";
import MonthlyBreakdown from "./pages/MonthlyBreakdown";
import EMIPayments from "./pages/EMIPayments";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/loans">
        {() => (
          <DashboardLayout>
            <Loans />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/income">
        {() => (
          <DashboardLayout>
            <Income />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/expenses">
        {() => (
          <DashboardLayout>
            <Expenses />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/monthly-summary">
        {() => (
          <DashboardLayout>
            <MonthlySummary />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/debt-projection">
        {() => (
          <DashboardLayout>
            <DebtProjection />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/emi-timeline">
        {() => (
          <DashboardLayout>
            <EMITimeline />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/emi-calendar">
        {() => (
          <DashboardLayout>
            <EMICalendar />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/emi-payments">
        {() => (
          <DashboardLayout>
            <EMIPayments />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/monthly-breakdown">
        {() => (
          <DashboardLayout>
            <MonthlyBreakdown />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
