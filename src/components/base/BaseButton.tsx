type Variant = 'primary' | 'secondary';

type Props = {
  label: string;
  onClick: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50',
};

/**
 * A plain action button. Holds no logic — it renders a label and calls back on
 * click. `fullWidth` is the only layout escape hatch the callers need so far.
 */
export function BaseButton({ label, onClick, variant = 'primary', disabled, fullWidth }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${VARIANTS[variant]} ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {label}
    </button>
  );
}
