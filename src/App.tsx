import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

// المبيعات
import QuotesPage from './pages/sales/QuotesPage';
import SalesContractsPage from './pages/sales/SalesContractsPage';
// التسويق
import CampaignsPage from './pages/marketing/CampaignsPage';
import ContentPage from './pages/marketing/ContentPage';
// المالية
import FinancePage from './pages/finance/FinancePage';
import InvoicesPage from './pages/finance/InvoicesPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import CashFlowPage from './pages/finance/CashFlowPage';
import PLPage from './pages/finance/PLPage';
import FreelancePage from './pages/finance/FreelancePage'; // المسار الجديد
// المشاريع
import ProjectsPage from './pages/projects/ProjectsPage';
import TaskManager from './pages/projects/TaskManager';
import CalendarPage from './pages/projects/CalendarPage';
// الموارد البشرية
import HRPage from './pages/hr/HRPage';
import HRPayroll from './pages/hr/HRPayroll';
import Performance from './pages/hr/Performance';
// العملاء (CRM)
import LeadsPage from './pages/crm/LeadsPage';
import ActiveClientsPage from './pages/crm/ActiveClientsPage';
import ClientsPage from './pages/crm/ClientsPage';
import QuotePage from './pages/crm/QuotePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sales/quotes" element={<QuotesPage />} />
              <Route path="/sales/contracts" element={<SalesContractsPage />} />
              <Route path="/crm/leads" element={<LeadsPage />} />
              <Route path="/crm/active" element={<ActiveClientsPage />} />
              <Route path="/crm/clients" element={<ClientsPage />} />
              <Route path="/crm/quote/:id" element={<QuotePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/finance/invoices" element={<InvoicesPage />} />
              <Route path="/finance/expenses" element={<ExpensesPage />} />
              <Route path="/finance/freelance" element={<FreelancePage />} /> {/* المسار الجديد */}
              <Route path="/finance/cash-flow" element={<CashFlowPage />} />
              <Route path="/finance/pl" element={<PLPage />} />
              <Route path="/marketing/campaigns" element={<CampaignsPage />} />
              <Route path="/marketing/content" element={<ContentPage />} />
              <Route path="/hr" element={<HRPage />} />
              <Route path="/hr/payroll" element={<HRPayroll />} />
              <Route path="/hr/performance" element={<Performance />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}