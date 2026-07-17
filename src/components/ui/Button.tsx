import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark disabled:hover:bg-primary',
  secondary:
    'border border-black/10 bg-white text-black hover:bg-black/5',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-black/60 hover:text-black underline-offset-2 hover:underline',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    variant === 'ghost'
      ? 'text-sm font-medium disabled:opacity-40'
      : 'rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

  return <button className={`${base} ${VARIANT_CLASS[variant]} ${className}`} {...props} />;
}
