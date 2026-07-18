type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

/** A labelled multi-line text field. Controlled — value in, onChange out, no logic. */
export function BaseTextarea({ label, value, onChange, rows = 3 }: Props) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <textarea
        rows={rows}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
