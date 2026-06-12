import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, trend, color = '#00704A' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-mist text-sm font-medium">{title}</p>
          <p className="text-ink text-3xl font-bold mt-1" style={{ fontFamily: '"Playfair Display", serif' }}>
            {value}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trend && (
        <p className="text-xs text-mist">
          <span className="text-matcha font-medium">{trend}</span> vs semaine dernière
        </p>
      )}
      <p className="text-xs text-mist/60">En direct de votre base de données</p>
    </div>
  );
}
