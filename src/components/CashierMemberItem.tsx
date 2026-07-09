'use client';

import { Stamp, Loader2, Gift } from 'lucide-react';
import type { Member } from '../types';
import { getInitials } from '../lib/utils';

interface Props {
  member: Member;
  totalStamps: number;
  onPunch: (member: Member) => void;
  isPunching: boolean;
  onRedeem: (member: Member) => void;
  isRedeeming: boolean;
}

/** Carte membre adaptée au mobile pour l'app caissier. */
export function CashierMemberItem({ member, totalStamps, onPunch, isPunching, onRedeem, isRedeeming }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ background: '#00704A' }}
      >
        {getInitials(member.first_name, member.last_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-ink font-semibold text-sm truncate">
          {member.first_name} {member.last_name}
        </p>
        <p className="text-mist text-xs truncate">{member.email}</p>
        <p className="text-ink text-xs font-semibold mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {member.punches}/{totalStamps} tampons
        </p>
      </div>
      {member.reward_available ? (
        <button
          onClick={() => onRedeem(member)}
          disabled={isRedeeming}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ background: '#CBA258' }}
        >
          {isRedeeming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
          Utiliser
        </button>
      ) : (
        <button
          onClick={() => onPunch(member)}
          disabled={isPunching}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ background: '#00704A' }}
        >
          {isPunching ? <Loader2 size={14} className="animate-spin" /> : <Stamp size={14} />}
          Tampon
        </button>
      )}
    </div>
  );
}
