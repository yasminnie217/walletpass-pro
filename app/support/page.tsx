import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Support — Fidely',
  description: 'Besoin d\'aide avec Fidely ? Contactez notre équipe de support.',
};

const SUPPORT_EMAIL = 'yasmineschool10@gmail.com';

export default function Support() {
  return (
    <div style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
      <SiteHeader />

      <section className="max-w-2xl mx-auto px-6 pt-12 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          Support client
        </h1>
        <p className="text-mist mb-8">Nous sommes là pour vous aider. Réponse sous 24 à 48 heures ouvrables.</p>

        {/* Contact courriel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#00704A15' }}>
              <Mail size={20} style={{ color: '#00704A' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-ink font-semibold mb-1">Par courriel</h2>
              <p className="text-mist text-sm mb-3">
                Écrivez-nous pour toute question sur votre compte, la facturation ou une aide technique.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ background: '#00704A' }}
              >
                <Mail size={15} />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#CBA25820' }}>
              <HelpCircle size={20} style={{ color: '#CBA258' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-ink font-semibold mb-1">Consultez la FAQ</h2>
              <p className="text-mist text-sm mb-3">
                La réponse à votre question s'y trouve peut-être déjà.
              </p>
              <Link href="/faq" className="text-sm font-medium" style={{ color: '#00704A' }}>
                Voir la FAQ →
              </Link>
            </div>
          </div>
        </div>

        {/* Astuce commerçant */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#00704A15' }}>
              <MessageCircle size={20} style={{ color: '#00704A' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-ink font-semibold mb-1">Vous êtes déjà commerçant ?</h2>
              <p className="text-mist text-sm mb-3">
                Connectez-vous à votre espace pour gérer vos cartes, membres et abonnement.
              </p>
              <Link href="/login" className="text-sm font-medium" style={{ color: '#00704A' }}>
                Espace commerçant →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
