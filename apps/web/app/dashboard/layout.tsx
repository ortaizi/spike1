import { ProtectedRoute } from '../../components/auth/protected-route';
import './globals-dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        {children}
      </div>
    </ProtectedRoute>
  );
} 