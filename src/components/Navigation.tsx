import { Link, useLocation, useNavigate } from 'react-router';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  BarChart3,
  Timer,
  CalendarDays,
  Heart,
  Watch,
  Info,
  CreditCard,
  Globe,
  Menu,
  X,
  LogOut,
  User,
  Dumbbell,
  History,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const { t, lang, setLang } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const localized = (pt: string, en: string, de = en) => lang === 'pt' ? pt : lang === 'de' ? de : en;

  const navItems = [
    { path: '/inicio', icon: Home, label: t.nav.home },
    { path: '/treino', icon: Dumbbell, label: localized('Treino do Dia', 'Today’s Workout', 'Training heute') },
    { path: '/biblioteca', icon: BookOpen, label: localized('Biblioteca', 'Library', 'Bibliothek') },
    { path: '/historico', icon: History, label: localized('Histórico', 'History', 'Verlauf') },
    { path: '/dashboard', icon: CalendarDays, label: t.nav.dashboard },
    { path: '/benchmarks', icon: BarChart3, label: t.nav.benchmarks },
    { path: '/timer', icon: Timer, label: t.nav.timer },
    { path: '/recovery', icon: Heart, label: t.nav.recovery },
    { path: '/wearables', icon: Watch, label: t.nav.wearables },
    { path: '/about', icon: Info, label: t.nav.about },
    { path: '/subscription', icon: CreditCard, label: t.nav.subscription },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-orange-500/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/inicio" className="mr-6 flex items-center space-x-2">
          <img src="/logo-v2.png" alt="HybridTracker" className="h-8 w-8 rounded-full" />
          <span className="text-xl font-bold text-orange-500">
            HybridTracker
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex flex-1 items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'hover:bg-orange-500/10 hover:text-orange-300'
              }`}
            >
              <item.icon className="mr-1.5 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Language toggle + Auth */}
        <div className="ml-auto flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                <Globe className="h-4 w-4" />
                {lang.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-orange-500/20">
              <DropdownMenuItem onClick={() => setLang('pt')} className={lang === 'pt' ? 'bg-orange-500/20' : ''}>
                🇧🇷 Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang('en')} className={lang === 'en' ? 'bg-orange-500/20' : ''}>
                🇬🇧 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang('de')} className={lang === 'de' ? 'bg-orange-500/20' : ''}>
                🇩🇪 Deutsch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                  <User className="h-4 w-4" />
                  <span className="max-w-[80px] truncate">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-orange-500/20">
                <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  {localized('Sair', 'Log out', 'Abmelden')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                {localized('Entrar', 'Log in', 'Anmelden')}
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0 text-orange-400"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-orange-500/20 bg-background px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'hover:bg-orange-500/10'
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-400 w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {localized('Sair', 'Log out', 'Abmelden')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
