'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, QrCode, Users } from 'lucide-react';

const TABS = [
  { href: '/caisse/scan', label: 'Scanner', Icon: ScanLine },
  { href: '/caisse/carte', label: 'Ma carte', Icon: QrCode },
  { href: '/caisse/membres', label: 'Membres', Icon: Users },
];

export function CaisseNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{ color: active ? '#00704A' : '#9ca3af' }}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
