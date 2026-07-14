'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Camera, CreditCard, Users, Bell, Settings, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { href: '/scanner', icon: Camera, label: 'Scanner' },
  { href: '/card', icon: CreditCard, label: 'Ma carte' },
  { href: '/members', icon: Users, label: 'Membres' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? 'bg-matcha text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
        style={{ background: '#00704A' }}
      >
        F
      </div>
      <span className="text-white font-semibold text-base" style={{ fontFamily: '"Playfair Display", serif' }}>
        Fidely
      </span>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le tiroir à chaque changement de page
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Desktop — barre latérale fixe */}
      <aside
        className="hidden md:flex flex-col h-full"
        style={{ width: '260px', minWidth: '260px', background: '#1E3932' }}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <Brand />
        </div>
        <NavLinks />
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-white/30 text-xs">© 2026 Fidely</p>
        </div>
      </aside>

      {/* Mobile — barre supérieure fixe */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: '#1E3932' }}
      >
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="text-white p-2 -mr-2"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile — tiroir + overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 flex flex-col" style={{ background: '#1E3932' }}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="text-white/70 p-1">
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="px-6 py-4 border-t border-white/10">
              <p className="text-white/30 text-xs">© 2026 Fidely</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
