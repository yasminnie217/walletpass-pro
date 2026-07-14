import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 mt-8">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-mist text-sm">© 2026 Fidely. Tous droits réservés.</p>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/faq" className="text-mist hover:text-ink transition-colors">FAQ</Link>
          <Link href="/support" className="text-mist hover:text-ink transition-colors">Support</Link>
          <a href="mailto:yasmineschool10@gmail.com" className="text-mist hover:text-ink transition-colors">
            yasmineschool10@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
