import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import InvoicesPage from '@/pages/finance/InvoicesPage';
import ExpensesPage from '@/pages/finance/ExpensesPage';
import CashFlowPage from '@/pages/finance/CashFlowPage';
import PLPage from '@/pages/finance/PLPage';

import ProjectsPage from './pages/projects/ProjectsPage';
import TaskManager from './pages/projects/TaskManager';
import CalendarPage from './pages/projects/CalendarPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              
              <Route path="/finance/invoices" element={<InvoicesPage />} />
              <Route path="/finance/expenses" element={<ExpensesPage />} />
              <Route path="/finance/cash-flow" element={<CashFlowPage />} />
              <Route path="/finance/pl" element={<PLPage />} />
              
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}