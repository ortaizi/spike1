import { ProtectedRoute } from '../../components/auth/protected-route';

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