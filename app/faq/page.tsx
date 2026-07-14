import type { Metadata } from 'next';
import { SiteHeader } from '@/src/components/SiteHeader';
import { SiteFooter } from '@/src/components/SiteFooter';

export const metadata: Metadata = {
  title: 'FAQ — Fidely',
  description: 'Questions fréquentes sur Fidely : cartes de fidélité Google Wallet, essai, abonnement, fonctionnement.',
};

const faqs = [
  {
    q: "Qu'est-ce que Fidely ?",
    a: "Fidely est un service qui permet aux commerces de créer des cartes de fidélité numériques que leurs clients ajoutent à Google Wallet. Vos clients collectent des tampons à chaque visite et obtiennent une récompense une fois la carte pleine.",
  },
  {
    q: "Mes clients doivent-ils installer une application ?",
    a: "Non. La carte de fidélité s'ajoute directement à Google Wallet, déjà présent sur la plupart des téléphones Android. Le client scanne un code QR ou ouvre un lien, et sa carte est prête.",
  },
  {
    q: "Comment ajoute-t-on un tampon à un client ?",
    a: "Depuis votre tableau de bord ou l'app caissier, vous scannez le code QR de la carte du client. Le tampon s'ajoute et sa carte se met à jour en temps réel.",
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Chaque nouveau compte bénéficie de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités. Aucune carte de crédit n'est requise pour commencer.",
  },
  {
    q: "Combien coûte l'abonnement ?",
    a: "Après l'essai gratuit de 14 jours, l'abonnement Fidely est de 200 $/mois, annulable en tout temps. Il débloque les membres illimités, les notifications, les exports, les notifications de proximité et l'app caissier.",
  },
  {
    q: "Puis-je envoyer des notifications à mes clients ?",
    a: "Oui. Vous pouvez envoyer des messages à tous vos membres (promotions, nouveautés) qui apparaissent sur leur carte, et activer des rappels de proximité quand ils passent près de votre commerce.",
  },
  {
    q: "Est-ce que je peux personnaliser ma carte ?",
    a: "Oui : logo, couleur, nom de la carte, description de la récompense et nombre de tampons requis sont entièrement personnalisables depuis votre tableau de bord.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Oui. Chaque commerce ne voit que ses propres membres, les accès sont protégés et les mots de passe respectent des règles de sécurité strictes. Aucune donnée de paiement n'est stockée dans les cartes.",
  },
  {
    q: "Comment annuler mon abonnement ?",
    a: "Vous pouvez annuler à tout moment depuis la page Abonnement de votre tableau de bord. Vous gardez l'accès jusqu'à la fin de la période payée.",
  },
];

export default function FAQ() {
  return (
    <div style={{ background: '#F9F6F0', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 pt-12 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
          Questions fréquentes
        </h1>
        <p className="text-mist mb-10">Tout ce qu'il faut savoir sur Fidely.</p>

        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-ink font-semibold text-base mb-2">{f.q}</h2>
              <p className="text-mist text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-mist text-sm">
            Vous ne trouvez pas votre réponse ?{' '}
            <a href="/support" className="font-medium" style={{ color: '#00704A' }}>Contactez notre support →</a>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
