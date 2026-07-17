import type { ReactNode } from 'react';

type Props = {
  title: string;
  accent: string;
  selected?: boolean;
  children?: ReactNode;
};

export function NodeShell({ title, accent, selected, children }: Props) {
  return (
    <div
      className={`w-52 overflow-hidden rounded-lg border bg-white shadow-sm ${
        selected ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300'
      }`}
    >
      <div className={`px-3 py-1.5 text-xs font-semibold tracking-wide text-white uppercase ${accent}`}>
        {title}
      </div>
      {children && <div className="px-3 py-2 text-sm text-slate-700">{children}</div>}
    </div>
  );
}
