import { type ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CardProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: ReactNode;
  headerRight?: ReactNode;
}

export function Card({
  title,
  icon,
  description,
  children,
  className = '',
  collapsible = false,
  defaultExpanded = true,
  badge,
  headerRight,
}: CardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          collapsible ? 'cursor-pointer hover:bg-white/[0.02]' : ''
        }`}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-purple)]/10 flex items-center justify-center text-[var(--accent-purple)]">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {collapsible &&
            (expanded ? (
              <ChevronUp size={18} className="text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-secondary)]" />
            ))}
        </div>
      </div>
      {(!collapsible || expanded) && (
        <div className="px-5 pb-5 border-t border-[var(--border-color)]">{children}</div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon?: ReactNode;
}

export function StatCard({ label, value, change, changePositive, icon }: StatCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="text-[var(--accent-purple)] opacity-60">{icon}</div>}
      </div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      {change && (
        <div
          className={`text-xs mt-1 font-medium ${
            changePositive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {changePositive ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}
