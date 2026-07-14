import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background: '#00704A' }}
        >
          F
        </div>
        <span className="text-lg font-bold text-ink" style={{ fontFamily: '"Playfair Display", serif' }}>
          Fidely
        </span>
      </Link>
      <div className="flex items-center gap-5">
        <Link href="/faq" className="hidden sm:block text-sm text-mist hover:text-ink transition-colors">FAQ</Link>
        <Link href="/support" className="hidden sm:block text-sm text-mist hover:text-ink transition-colors">Support</Link>
        <Link
          href="/login"
          className="px-5 py-2 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
          style={{ background: '#00704A' }}
        >
          Espace commerçant
        </Link>
      </div>
    </header>
  );
}
