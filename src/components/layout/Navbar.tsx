import { useNavigate, useLocation } from 'react-router-dom';
import { Landmark, Home, Users, LogOut, User, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Početna',
    path: '/dashboard',
    icon: <Home className="mr-1.5 h-4 w-4" />,
  },
  {
    label: 'Zaposleni',
    path: '/admin/employees',
    icon: <Users className="mr-1.5 h-4 w-4" />,
    adminOnly: true,
  },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="container flex h-14 items-center">
        <div
          className="flex cursor-pointer items-center gap-2 font-bold mr-6"
          onClick={() => navigate('/dashboard')}
        >
          <Landmark className="h-5 w-5" />
          <span className="text-lg">Banka 2025</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {visibleItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={cn(
                'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10',
                isActive(item.path) &&
                  'bg-primary-foreground/15 text-primary-foreground'
              )}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary-foreground/10"
          onClick={() => {
            const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(next);
          }}
          title={`Tema: ${theme === 'light' ? 'Svetla' : theme === 'dark' ? 'Tamna' : 'Sistemska'}`}
        >
          {theme === 'light' && <Sun className="h-4 w-4" />}
          {theme === 'dark' && <Moon className="h-4 w-4" />}
          {theme === 'system' && <Monitor className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary-foreground/10"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Odjavi se</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
