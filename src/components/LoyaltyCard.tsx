import { Star } from 'lucide-react';
import type { Client } from '../types';

interface LoyaltyCardProps {
  client: Client;
  punches?: number;
  animateLastStamp?: boolean;
}

// Assombrit une couleur hex d'un facteur donné (0 = inchangé, 1 = noir)
function darken(hex: string, amount: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  const r = Math.round(((num >> 16) & 255) * (1 - amount));
  const g = Math.round(((num >> 8) & 255) * (1 - amount));
  const b = Math.round((num & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export function LoyaltyCard({ client, punches = 0, animateLastStamp = false }: LoyaltyCardProps) {
  const total = client.total_stamps || 5;
  const filled = Math.min(punches, total);
  const accentColor = client.primary_color || '#00704A';
  const darkColor = darken(accentColor, 0.45);

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1.6',
        background: `linear-gradient(135deg, ${darkColor} 0%, ${accentColor} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 40px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative h-full flex flex-col p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-auto">
          {/* Logo */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
          >
            {client.logo_url ? (
              <img src={client.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (client.business_name || 'W').charAt(0).toUpperCase()
            )}
          </div>

          {/* Card name center */}
          <div className="flex-1 text-center px-3">
            <h3
              className="text-white font-semibold leading-tight"
              style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px' }}
            >
              {client.card_name || 'Carte Fidélité'}
            </h3>
            {client.organization_name && (
              <p className="text-white/60 text-xs mt-0.5">{client.organization_name}</p>
            )}
          </div>

          {/* GOLD badge */}
          <div
            className="px-2 py-0.5 rounded-full text-xs font-bold tracking-wide flex-shrink-0"
            style={{
              background: 'rgba(203,162,88,0.2)',
              border: '1px solid #CBA258',
              color: '#CBA258',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            GOLD
          </div>
        </div>

        {/* Stamps */}
        <div className="my-3">
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: total }).map((_, i) => {
              const isFilled = i < filled;
              const isJustStamped = animateLastStamp && i === filled - 1;
              return (
                <div
                  key={i}
                  className="transition-all duration-300"
                  style={{
                    transform: isJustStamped ? 'scale(1.3)' : 'scale(1)',
                    filter: isJustStamped ? 'drop-shadow(0 0 6px #CBA258)' : 'none',
                  }}
                >
                  {isFilled ? (
                    <Star size={20} fill="#CBA258" color="#CBA258" />
                  ) : (
                    <div
                      className="rounded-full border-2"
                      style={{ width: '20px', height: '20px', borderColor: 'rgba(203,162,88,0.4)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-white/60 text-xs mt-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {filled} sur {total} tampons
          </p>
        </div>

        {/* Bottom reward */}
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/80 text-xs">Récompense</p>
          <p className="text-white font-medium text-sm truncate">
            {client.reward_description || 'Récompense gratuite'}
          </p>
        </div>
      </div>
    </div>
  );
}
