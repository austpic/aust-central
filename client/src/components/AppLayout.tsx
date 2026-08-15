import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import AmbientBackground from './AmbientBackground';

// Logged-in app shell: a single top navigation bar at every screen size
// (replaces the old left sidebar), with routed content full-width below it.
// Each view manages its own header/max-width, so no title bar is needed here.
export default function AppLayout() {
  return (
    <div className="min-h-svh">
      <AmbientBackground />
      <TopNav />
      <main className="page-in relative z-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
