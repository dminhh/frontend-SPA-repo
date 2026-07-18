type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
};

/** A labelled single-line text field. Controlled — value in, onChange out, no logic. */
export function BaseInput({ label, value, onChange, mono }: Props) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        className={`w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none ${
          mono ? 'font-mono' : ''
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
