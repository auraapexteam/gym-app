import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-aura-bg flex items-center justify-center">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-aura-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

// Lazy loaded pages
const SplashPage = lazy(() => import('@/pages/auth/SplashPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const MembersPage = lazy(() => import('@/pages/members/MembersPage'));
const MemberProfilePage = lazy(() => import('@/pages/members/MemberProfilePage'));
const CheckInsPage = lazy(() => import('@/pages/checkins/CheckInsPage'));
const PlansPage = lazy(() => import('@/pages/plans/PlansPage'));
const TrainersPage = lazy(() => import('@/pages/trainers/TrainersPage'));
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'));
const EquipmentPage = lazy(() => import('@/pages/equipment/EquipmentPage'));
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const StaffPage = lazy(() => import('@/pages/staff/StaffPage'));
const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const BrowseGymsPage = lazy(() => import('@/pages/customer/BrowseGymsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Super Admin Pages
const ManageGymsPage = lazy(() => import('@/pages/super-admin/ManageGymsPage'));
const ManageOwnersPage = lazy(() => import('@/pages/super-admin/ManageOwnersPage'));
const PlatformAnalyticsPage = lazy(() => import('@/pages/super-admin/PlatformAnalyticsPage'));

export function AppRouter() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Splash */}
        <Route path="/" element={<SplashPage />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={useAuthStore.getState().user?.role === 'super_admin' ? '/super-admin/gyms' : useAuthStore.getState().user?.role === 'customer' ? '/browse-gyms' : '/dashboard'} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={useAuthStore.getState().user?.role === 'super_admin' ? '/super-admin/gyms' : useAuthStore.getState().user?.role === 'customer' ? '/browse-gyms' : '/dashboard'} replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/add" element={<MembersPage defaultShowAdd={true} />} />
          <Route path="/members/:id" element={<MemberProfilePage />} />
          <Route path="/checkins" element={<CheckInsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/trainers" element={<TrainersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/browse-gyms" element={<BrowseGymsPage />} />

          {/* Super Admin Protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/super-admin/gyms" element={<ManageGymsPage />} />
            <Route path="/super-admin/owners" element={<ManageOwnersPage />} />
            <Route path="/super-admin/analytics" element={<PlatformAnalyticsPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
