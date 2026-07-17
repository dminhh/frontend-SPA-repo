import { NODE_DEFS } from '../nodes';

export function NodePalette() {
  return (
    <aside className="w-48 shrink-0 border-r border-slate-200 bg-white p-3">
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Node</h2>
      <div className="flex flex-col gap-2">
        {NODE_DEFS.map((def) => (
          <div
            key={def.type}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/bot-node-type', def.type);
              event.dataTransfer.effectAllowed = 'move';
            }}
            className={`cursor-grab rounded-md px-3 py-2 text-sm font-medium text-white active:cursor-grabbing ${def.accent}`}
          >
            {def.label}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        Kéo node vào canvas. Nối các node bằng cách kéo từ chấm tròn dưới sang chấm tròn trên.
      </p>
    </aside>
  );
}
