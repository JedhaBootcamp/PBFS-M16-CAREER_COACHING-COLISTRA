import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../ui/cn';
import { ErrorBoundary } from './ErrorBoundary';

const NAV_ITEMS = [
  { to: '/orders', label: 'Orders to ship' },
  { to: '/shipments', label: 'Shipments' },
];

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-6 bg-ink px-5 py-4 text-white md:w-60 md:flex-col md:items-stretch md:py-6">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="size-8" />
          <div className="leading-tight">
            <p className="font-semibold">Atelier Lune</p>
            <p className="text-xs text-white/60">Shipping</p>
          </div>
        </div>
        <nav className="flex gap-1 md:mt-6 md:flex-col">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm transition-colors', isActive ? 'bg-white/15 font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
