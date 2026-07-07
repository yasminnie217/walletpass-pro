'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Camera, CreditCard, Users, Bell, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { href: '/scanner', icon: Camera, label: 'Scanner' },
  { href: '/card', icon: CreditCard, label: 'Ma carte' },
  { href: '/members', icon: Users, label: 'Membres' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: '260px', minWidth: '260px', background: '#1E3932' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#00704A' }}
          >
            W
          </div>
          <span className="text-white font-semibold text-base" style={{ fontFamily: '"Playfair Display", serif' }}>
            WalletPass Pro
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-matcha text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">© 2026 WalletPass Pro</p>
      </div>
    </aside>
  );
}
