import { Outlet } from 'react-router-dom';
import ClientSidebar from '../shared/ClientSidebar';
import RouteErrorBoundary from '../shared/RouteErrorBoundary';

export default function MainLayout() {
  return (
    <>
      <ClientSidebar />
      <main className="md:ml-64 min-h-screen bg-muted/40">
        <div className="container py-6">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </main>
    </>
  );
}
