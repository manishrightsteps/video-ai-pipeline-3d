import { useEffect, useRef } from 'react';

export default function Captions({ messages, tutorName }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">The lesson captions will appear here.</p>;
  }

  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'agent' ? 'rounded-tl-sm bg-sky-50 text-slate-800' : 'rounded-tr-sm bg-emerald-500 text-white'
            }`}
          >
            <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wide opacity-60">
              {m.role === 'agent' ? tutorName : 'You'}
            </span>
            {m.text}
          </div>
        </li>
      ))}
      <li ref={endRef} />
    </ul>
  );
}
