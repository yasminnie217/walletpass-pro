import type { Metadata, Viewport } from 'next';
import { CaisseNav } from '@/src/components/CaisseNav';
import { RegisterSW } from '@/src/components/RegisterSW';

export const metadata: Metadata = {
  title: 'Fidely Caisse',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Caisse' },
};

export const viewport: Viewport = {
  themeColor: '#00704A',
};

export default function CaisseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif' }}
    >
      <RegisterSW />
      {/* Contenu défilant, marge basse pour ne pas passer sous la barre d'onglets */}
      <div className="pb-24">{children}</div>
      <CaisseNav />
    </div>
  );
}
