import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ClientSidebar from '../shared/ClientSidebar';
import RouteErrorBoundary from '../shared/RouteErrorBoundary';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <ClientSidebar />
        <main className="flex-1 bg-muted/40">
          <div className="container py-6">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
