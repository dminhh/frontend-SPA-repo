import { BaseButton } from '../components/base/BaseButton';
import { BaseInput } from '../components/base/BaseInput';
import { BaseTextarea } from '../components/base/BaseTextarea';
import { LABELS, type BotNode } from '../types';

type Props = {
  node: BotNode | undefined;
  onChange: (id: string, patch: Record<string, string>) => void;
  onDelete: (id: string) => void;
};

export function Inspector({ node, onChange, onDelete }: Props) {
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
        <BaseTextarea
          label="Nội dung"
          value={node.data.text}
          onChange={(v) => onChange(node.id, { text: v })}
        />
      )}

      {node.type === 'ask' && (
        <>
          <BaseTextarea
            label="Câu hỏi"
            value={node.data.question}
            onChange={(v) => onChange(node.id, { question: v })}
          />
          <BaseInput
            label="Tên biến"
            value={node.data.variable}
            onChange={(v) => onChange(node.id, { variable: v })}
            mono
          />
        </>
      )}

      {node.type === 'condition' && (
        <BaseInput
          label="Biểu thức"
          value={node.data.expression}
          onChange={(v) => onChange(node.id, { expression: v })}
          mono
        />
      )}

      {node.type === 'llm' && (
        <>
          <p className="mb-3 font-mono text-xs text-slate-500">Model: {node.data.model}</p>
          <BaseTextarea
            label="System prompt"
            value={node.data.systemPrompt}
            onChange={(v) => onChange(node.id, { systemPrompt: v })}
          />
          <BaseTextarea
            label="Prompt (chèn biến bằng {{tên}})"
            value={node.data.prompt}
            onChange={(v) => onChange(node.id, { prompt: v })}
          />
          <BaseInput
            label="Biến lưu câu trả lời"
            value={node.data.outputVar}
            onChange={(v) => onChange(node.id, { outputVar: v })}
            mono
          />
        </>
      )}

      {(node.type === 'start' || node.type === 'end') && (
        <p className="text-sm text-slate-400">Node này không có thuộc tính nào.</p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <BaseButton label="Xóa node" variant="danger" fullWidth onClick={() => onDelete(node.id)} />
      </div>
    </div>
  );
}
