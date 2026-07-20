import { useState } from 'react';
import type { Script } from '../build/compile';
import { BaseButton } from '../components/base/BaseButton';
import { BaseModal } from '../components/base/BaseModal';
import { advance, createRun, type RunState, type TranscriptEntry } from './interpreter';

type Props = {
  script: Script;
  onClose: () => void;
};

export function RunModal({ script, onClose }: Props) {
  const [state, setState] = useState<RunState>(() => createRun(script));
  const [input, setInput] = useState('');

  function submit() {
    if (state.status !== 'awaiting_input') return;
    setState(advance(state, script, input));
    setInput('');
  }

  return (
    <BaseModal open title="Chạy thử bot" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4">
        {state.transcript.map((entry, i) => (
          <Bubble key={i} entry={entry} />
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        {state.status === 'awaiting_input' ? (
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
            />
            <BaseButton label="Gửi" onClick={submit} />
          </div>
        ) : (
          <BaseButton
            label="Chạy lại"
            variant="secondary"
            onClick={() => setState(createRun(script))}
          />
        )}
      </div>
    </BaseModal>
  );
}

function Bubble({ entry }: { entry: TranscriptEntry }) {
  const style =
    entry.role === 'bot'
      ? 'self-start bg-slate-100 text-slate-800'
      : entry.role === 'user'
        ? 'self-end bg-slate-900 text-white'
        : 'self-center bg-amber-50 text-amber-700 text-xs';
  return <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${style}`}>{entry.text}</div>;
}
