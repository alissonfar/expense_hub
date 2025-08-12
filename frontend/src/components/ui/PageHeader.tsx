import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type HeaderVariant = 'blue' | 'green' | 'neutral';

interface PrimaryAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  primaryAction?: PrimaryAction;
  rightActions?: React.ReactNode;
  variant?: HeaderVariant;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
}

const variantConfig: Record<HeaderVariant, { iconBg: string; titleGradient: string; cta: string; ctaHover: string; }>
  = {
    blue: {
      iconBg: 'from-blue-600 to-purple-600',
      titleGradient: 'from-gray-900 to-blue-600',
      cta: 'from-blue-600 to-purple-600',
      ctaHover: 'hover:from-blue-700 hover:to-purple-700',
    },
    green: {
      iconBg: 'from-green-600 to-emerald-600',
      titleGradient: 'from-gray-900 to-green-600',
      cta: 'from-green-600 to-emerald-600',
      ctaHover: 'hover:from-green-700 hover:to-emerald-700',
    },
    neutral: {
      iconBg: 'from-gray-600 to-gray-800',
      titleGradient: 'from-gray-900 to-gray-700',
      cta: 'from-gray-700 to-gray-900',
      ctaHover: 'hover:from-gray-800 hover:to-black',
    },
  };

export default function PageHeader({
  title,
  subtitle,
  icon,
  primaryAction,
  rightActions,
  variant = 'neutral',
  className,
  breadcrumbs,
  backHref,
  onBack,
  backLabel = 'Voltar',
}: PageHeaderProps) {
  const v = variantConfig[variant];

  const Primary = () => {
    if (!primaryAction) return null;
    const content = (
      <Button className={`bg-gradient-to-r ${v.cta} ${v.ctaHover} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}>
        {primaryAction.icon ? <span className="mr-2">{primaryAction.icon}</span> : null}
        {primaryAction.label}
      </Button>
    );
    if (primaryAction.href) {
      return (
        <Link href={primaryAction.href} onClick={primaryAction.onClick}>
          {content}
        </Link>
      );
    }
    return (
      <div onClick={primaryAction.onClick}>
        {content}
      </div>
    );
  };

  const Back = () => {
    if (!backHref && !onBack) return null;
    if (backHref) {
      return (
        <Link href={backHref} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> {backLabel}
        </Link>
      );
    }
    return (
      <button onClick={onBack} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> {backLabel}
      </button>
    );
  };

  const Breadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    return (
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 flex items-center gap-2">
        {breadcrumbs.map((bc, idx) => (
          <span key={`${bc.label}-${idx}`} className="inline-flex items-center gap-2">
            {bc.href ? (
              <Link href={bc.href} className="hover:text-gray-700">{bc.label}</Link>
            ) : (
              <span>{bc.label}</span>
            )}
            {idx < breadcrumbs.length - 1 && <span>/</span>}
          </span>
        ))}
      </nav>
    );
  };

  return (
    <div className={`flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ${className || ''}`}>
      <div className="flex items-center gap-4 w-full">
        {icon && (
          <div className={`w-12 h-12 bg-gradient-to-br ${v.iconBg} rounded-xl flex items-center justify-center shadow-lg text-white`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <Back />
                <Breadcrumbs />
              </div>
              <h1 className={`text-3xl font-bold bg-gradient-to-r ${v.titleGradient} bg-clip-text text-transparent`}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {rightActions}
              <Primary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 