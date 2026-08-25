import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './viewmodels/AuthContext';
import { CgpaProvider } from './viewmodels/CgpaContext';
import { BloodBankProvider } from './viewmodels/BloodBankContext';
import AppLayout from './components/AppLayout';
import RequireAuth from './components/RequireAuth';

import SplashView from './views/SplashView';
import WelcomeView from './views/WelcomeView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ForgotPasswordView from './views/ForgotPasswordView';
import VerifyEmailView from './views/VerifyEmailView';
import ResetPasswordView from './views/ResetPasswordView';
import LandingPage from './views/LandingPage';
import HomeView from './views/HomeView';
import TodoListView from './views/TodoListView';
import ClassReminderView from './views/ClassReminderView';
import NoticeBoardView from './views/NoticeBoardView';
import NotificationsView from './views/NotificationsView';
import BusView from './views/BusView';
import ScheduleView from './views/ScheduleView';
import BusSelectionView from './views/BusSelectionView';
import ReceiptView from './views/ReceiptView';
import CgpaCalculatorView from './views/CgpaCalculatorView';
import CgpaWhatifView from './views/CgpaWhatifView';
import CgpaHistoryView from './views/CgpaHistoryView';
import LabReportView from './views/LabReportView';
import BloodBankView from './views/BloodBankView';
import BloodRequestFormView from './views/BloodRequestFormView';
import BookExchangeView from './views/BookExchangeView';
import BookPostView from './views/BookPostView';
import BookListingDetailView from './views/BookListingDetailView';
import ChatView from './views/ChatView';
import BookNotificationsView from './views/BookNotificationsView';
import BookProfileView from './views/BookProfileView';
import SellerProfileView from './views/SellerProfileView';
import LostFoundView from './views/LostFoundView';
import ProfileView from './views/ProfileView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public landing page — first thing anyone sees, no login required */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth flow */}
          <Route path="/splash" element={<SplashView />} />
          <Route path="/welcome" element={<WelcomeView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/verify-email" element={<VerifyEmailView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />

          {/* Dashboard (AppLayout shell — top nav, protected app routes).
              RequireAuth bounces to /login when there is no restored session,
              mirroring the Flutter splash screen's auth gate. */}
          <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomeView />} />
            <Route path="/todo" element={<TodoListView />} />
            <Route path="/class-reminder" element={<ClassReminderView />} />
            <Route path="/transport" element={<BusView />} />
            <Route path="/transport/schedule" element={<ScheduleView />} />
            <Route path="/transport/buses" element={<BusSelectionView />} />
            <Route path="/transport/receipt" element={<ReceiptView />} />
            <Route path="/notice-board" element={<NoticeBoardView />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/lab-report" element={<LabReportView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/book-exchange" element={<BookExchangeView />} />
            <Route path="/book-exchange/post" element={<BookPostView />} />
            <Route path="/book-exchange/notifications" element={<BookNotificationsView />} />
            <Route path="/book-exchange/profile" element={<BookProfileView />} />
            <Route path="/book-exchange/seller/:id" element={<SellerProfileView />} />
            <Route path="/book-exchange/chat/:id" element={<ChatView />} />
            <Route path="/book-exchange/:id" element={<BookListingDetailView />} />
            <Route path="/lost-found" element={<LostFoundView />} />

            {/* CGPA flow — shared provider across calculator / what-if / history */}
            <Route
              element={
                <CgpaProvider>
                  <Outlet />
                </CgpaProvider>
              }
            >
              <Route path="/cgpa" element={<CgpaCalculatorView />} />
              <Route path="/cgpa/whatif" element={<CgpaWhatifView />} />
              <Route path="/cgpa/history" element={<CgpaHistoryView />} />
            </Route>

            {/* Blood bank flow — shared provider across list + request form */}
            <Route
              element={
                <BloodBankProvider>
                  <Outlet />
                </BloodBankProvider>
              }
            >
              <Route path="/blood-bank" element={<BloodBankView />} />
              <Route path="/blood-bank/request" element={<BloodRequestFormView />} />
            </Route>
          </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
