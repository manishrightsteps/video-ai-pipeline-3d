const YEARS = Array.from({ length: 11 }, (_, i) => i + 1);

const MODES = [
  { value: 'GUIDE_ME', label: 'Guide me (step by step)' },
  { value: 'ADAPTIVE', label: 'Adaptive' },
  { value: 'MAKE_IT_INTERESTING', label: 'Make it interesting (stories)' },
  { value: 'LET_ME_EXPLORE', label: 'Let me explore' },
  { value: 'CHALLENGE_ME', label: 'Challenge me' },
];

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 disabled:opacity-60';

function Label({ children, ...props }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500" {...props}>
      {children}
    </label>
  );
}

export default function LessonForm({ tutors, value, onChange, disabled }) {
  const tutor = tutors.find((t) => t.id === value.tutorId);
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  const setTutor = (e) => {
    const next = tutors.find((t) => t.id === e.target.value);
    onChange({ ...value, tutorId: next.id, subjectCode: next.subjects[0].code });
  };

  return (
    <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
      <div>
        <Label htmlFor="tutor">Tutor</Label>
        <select id="tutor" className={field} value={value.tutorId} onChange={setTutor} disabled={disabled}>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <select id="subject" className={field} value={value.subjectCode} onChange={set('subjectCode')} disabled={disabled}>
          {tutor?.subjects.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <Label htmlFor="topic">Today&apos;s topic</Label>
        <input
          id="topic"
          className={field}
          placeholder="e.g. Equivalent fractions"
          value={value.topic}
          onChange={set('topic')}
          disabled={disabled}
          maxLength={200}
        />
      </div>
      <div>
        <Label htmlFor="name">Student name</Label>
        <input id="name" className={field} placeholder="Zara" value={value.name} onChange={set('name')} disabled={disabled} maxLength={50} />
      </div>
      <div>
        <Label htmlFor="year">Year group</Label>
        <select id="year" className={field} value={value.year} onChange={set('year')} disabled={disabled}>
          {YEARS.map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <Label htmlFor="mode">Teaching style</Label>
        <select id="mode" className={field} value={value.learningMode} onChange={set('learningMode')} disabled={disabled}>
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
