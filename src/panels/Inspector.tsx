import { LABELS, type BotNode } from '../types';

type Props = {
  node: BotNode | undefined;
  onChange: (id: string, patch: Record<string, string>) => void;
};

export function Inspector({ node, onChange }: Props) {
  if (!node) {
    return (
      <div className="border-b border-slate-200 p-4 text-sm text-slate-400">
        Chọn một node để sửa.
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 p-4">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {LABELS[node.type]}
      </h2>

      {node.type === 'message' && (
        <Field
          label="Nội dung"
          value={node.data.text}
          onChange={(v) => onChange(node.id, { text: v })}
          multiline
        />
      )}

      {node.type === 'ask' && (
        <>
          <Field
            label="Câu hỏi"
            value={node.data.question}
            onChange={(v) => onChange(node.id, { question: v })}
            multiline
          />
          <Field
            label="Tên biến"
            value={node.data.variable}
            onChange={(v) => onChange(node.id, { variable: v })}
            mono
          />
        </>
      )}

      {node.type === 'condition' && (
        <Field
          label="Biểu thức"
          value={node.data.expression}
          onChange={(v) => onChange(node.id, { expression: v })}
          mono
        />
      )}

      {(node.type === 'start' || node.type === 'end') && (
        <p className="text-sm text-slate-400">Node này không có thuộc tính nào.</p>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  mono?: boolean;
};

function Field({ label, value, onChange, multiline, mono }: FieldProps) {
  const className = `w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none ${
    mono ? 'font-mono' : ''
  }`;

  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {multiline ? (
        <textarea rows={3} className={className} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={className} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
