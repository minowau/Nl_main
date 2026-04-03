import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResourcesDashboard } from './pages/dashboard/ResourcesDashboard';
import NavigatorDashboard from './pages/dashboard/NavigatorDashboard';
import GridMatrixPage from './pages/dashboard/GridMatrixPage';
import KnowledgeHubPage from './pages/dashboard/KnowledgeHubPage';
import { AppProvider } from './context/AppContext';
import { CustomCursor } from './components/ui/CustomCursor';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <CustomCursor />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<ResourcesDashboard />} />
          <Route path="/navigator" element={<NavigatorDashboard />} />
          <Route path="/navigator/course" element={<GridMatrixPage />} />
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/resources" element={<KnowledgeHubPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;