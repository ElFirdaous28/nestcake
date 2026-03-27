import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

type AppAlertVariant = 'error' | 'success' | 'warning' | 'info';

type AppAlertProps = {
  message?: string | null;
  variant?: AppAlertVariant;
};

const variantStyles: Record<AppAlertVariant, string> = {
  error: 'border-red-100 bg-red-50 text-red-600',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  info: 'border-sky-100 bg-sky-50 text-sky-700',
};

const variantIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

export function AppAlert({ message, variant = 'error' }: AppAlertProps) {
  if (!message) {
    return null;
  }

  const Icon = variantIcons[variant];

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-1 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${variantStyles[variant]}`}
    >
      <Icon className="h-4 w-4" />
      {message}
    </div>
  );
}
