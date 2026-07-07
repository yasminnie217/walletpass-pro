import { Stamp, Loader2, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Member } from '../types';
import { getInitials, formatDate } from '../lib/utils';

interface MemberRowProps {
  member: Member;
  totalStamps: number;
  onPunch: (member: Member) => void;
  isPunching: boolean;
  onRedeem: (member: Member) => void;
  isRedeeming: boolean;
}

export function MemberRow({ member, totalStamps, onPunch, isPunching, onRedeem, isRedeeming }: MemberRowProps) {
  const router = useRouter();
  const goToDetail = () => router.push(`/members/${member.id}`);

  return (
    <tr className="border-b border-gray-100 hover:bg-cream/50 transition-colors">
      <td className="px-4 py-3 cursor-pointer" onClick={goToDetail}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: '#00704A' }}
          >
            {getInitials(member.first_name, member.last_name)}
          </div>
          <span className="text-ink font-medium text-sm hover:underline">{member.first_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-ink text-sm cursor-pointer" onClick={goToDetail}>{member.last_name}</td>
      <td className="px-4 py-3 text-mist text-sm cursor-pointer" onClick={goToDetail}>{member.email}</td>
      <td className="px-4 py-3">
        <span className="text-ink font-semibold text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {member.punches}/{totalStamps}
        </span>
      </td>
      <td className="px-4 py-3 text-mist text-xs">{formatDate(member.joined_at)}</td>
      <td className="px-4 py-3">
        {member.reward_available ? (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: '#CBA25820', color: '#CBA258', border: '1px solid #CBA258' }}
          >
            Récompense prête
          </span>
        ) : (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: '#00704A20', color: '#00704A', border: '1px solid #00704A' }}
          >
            Actif
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {member.reward_available ? (
            <button
              onClick={() => onRedeem(member)}
              disabled={isRedeeming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#CBA258' }}
            >
              {isRedeeming ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />}
              Utiliser
            </button>
          ) : (
            <button
              onClick={() => onPunch(member)}
              disabled={isPunching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#00704A' }}
            >
              {isPunching ? <Loader2 size={12} className="animate-spin" /> : <Stamp size={12} />}
              Tampon
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
