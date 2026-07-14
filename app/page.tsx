import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fidely — Cartes de fidélité numériques',
  description:
    "Fidely permet aux commerces de créer des cartes de fidélité numériques dans Google Wallet : tampons, récompenses, notifications et statistiques.",
};

const features = [
  {
    title: 'Cartes dans Google Wallet',
    body: 'Vos clients ajoutent leur carte de fidélité directement à Google Wallet, sans application à installer.',
  },
  {
    title: 'Tampons & récompenses',
    body: 'Le caissier scanne un code QR pour ajouter un tampon. Une fois la carte pleine, le client obtient sa récompense.',
  },
  {
    title: 'Notifications',
    body: 'Envoyez des messages à vos membres et des rappels de proximité quand ils passent près de votre commerce.',
  },
  {
    title: 'Statistiques & export',
    body: 'Suivez vos membres, vos tampons et vos récompenses. Exportez vos données en Excel ou CSV.',
  },
];

export default function Home() {
  return (
    <div style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: '#00704A' }}
          >
            F
          </div>
          <span className="text-lg font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
            Fidely
          </span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
          style={{ background: '#00704A' }}
        >
          Espace commerçant
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
        <h1
          className="text-4xl sm:text-5xl font-bold text-ink leading-tight"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          La carte de fidélité de vos clients, dans leur téléphone
        </h1>
        <p className="text-mist text-lg mt-5 leading-relaxed">
          Fidely aide les commerces à créer des cartes de fidélité numériques dans Google Wallet.
          Tampons, récompenses, notifications et statistiques — sans application à installer pour vos clients.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-full text-white font-semibold text-base transition-all hover:opacity-90"
            style={{ background: '#00704A' }}
          >
            Commencer
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold text-lg mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                {f.title}
              </h2>
              <p className="text-mist text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-mist text-sm">© 2026 Fidely. Tous droits réservés.</p>
          <a href="mailto:yasmineschool10@gmail.com" className="text-mist text-sm hover:text-ink transition-colors">
            yasmineschool10@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
