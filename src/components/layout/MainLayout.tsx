import { Outlet } from 'react-router-dom';
import ClientSidebar from '../shared/ClientSidebar';
import RouteErrorBoundary from '../shared/RouteErrorBoundary';

export default function MainLayout() {
  return (
    <>
      <ClientSidebar />
      <main className="md:ml-64 min-h-screen bg-muted/40">
        {/*
          Tailwind 4 ne pruza default `container` utility kao TW3.
          max-w-screen-2xl (1536px) daje vise horizontalnog prostora ali
          zadrzava lufta sa strane preko px-* utility-ja. NE koristimo
          mx-auto kombinaciju jer to centrira ispod 1536px viewport-a;
          ovde hocemo da content popuni dostupnu sirinu.
        */}
        <div className="max-w-screen-2xl px-6 sm:px-8 lg:px-12 py-6">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </div>
      </main>
    </>
  );
}
