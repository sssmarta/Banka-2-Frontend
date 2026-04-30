/**
 * Mounta Arbitro FAB + Panel iznad svih ruta.
 * Skriva se kad korisnik nije logovan ili je na login/landing/aktivacija stranicama.
 */
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArbitroActionModal } from './ArbitroActionModal';
import { ArbitroFAB } from './ArbitroFAB';
import { ArbitroPanel } from './ArbitroPanel';

const HIDDEN_ROUTES = new Set([
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/activate-account',
  '/403',
  '/500',
]);

export function ArbitroOverlay() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  if (HIDDEN_ROUTES.has(location.pathname)) return null;
  return (
    <>
      <ArbitroFAB />
      <ArbitroPanel />
      <ArbitroActionModal />
    </>
  );
}
