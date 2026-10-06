import { useEffect, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { createSession, getTutors } from './api.js';
import TutorCharacter from './components/TutorCharacter.jsx';
import LessonForm from './components/LessonForm.jsx';
import Captions from './components/Captions.jsx';

const keyStageFor = (year) => (year <= 2 ? 'KS1' : year <= 6 ? 'KS2' : year <= 9 ? 'KS3' : 'KS4');

const STATUS_TEXT = {
  disconnected: 'Ready when you are',
  connecting: 'Connecting…',
  connected: 'Lesson in progress',
  disconnecting: 'Ending lesson…',
};

function Classroom() {
  const [tutors, setTutors] = useState([]);
  const [form, setForm] = useState({
    tutorId: 'oliver',
    subjectCode: 'MATH',
    topic: '',
    name: '',
    year: '4',
    learningMode: 'GUIDE_ME',
  });
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const conversation = useConversation({
    onMessage: ({ message, role, event_id: eventId }) => {
      setMessages((prev) => [...prev, { id: `${eventId}-${role}-${prev.length}`, role, text: message }]);
    },
    onError: (message) => setError(typeof message === 'string' ? message : 'Something went wrong with the voice connection'),
  });

  const { status, isSpeaking, isMuted, setMuted, getOutputVolume } = conversation;
  const isLive = status === 'connected';
  const busy = starting || status === 'connecting' || status === 'disconnecting';
  const tutor = tutors.find((t) => t.id === form.tutorId);

  useEffect(() => {
    getTutors().then(setTutors).catch((err) => setError(`Can't reach the backend: ${err.message}`));
  }, []);

  async function startLesson() {
    setError('');
    setMessages([]);
    setStarting(true);
    try {
      // Ask for the mic up front so a denial shows a clear message.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const year = Number(form.year);
      const { signedUrl, overrides } = await createSession({
        tutorId: form.tutorId,
        subjectCode: form.subjectCode,
        learningMode: form.learningMode,
        ...(form.topic.trim() && { topic: form.topic.trim() }),
        student: {
          ...(form.name.trim() && { name: form.name.trim() }),
          yearGroup: `YEAR_${year}`,
          keyStage: keyStageFor(year),
        },
      });

      conversation.startSession({ signedUrl, overrides, connectionType: 'websocket' });
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Please allow microphone access to start the lesson.' : err.message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Right<span className="text-sky-500">Steps</span> Tutor
        </h1>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
            isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
          {STATUS_TEXT[status] ?? status}
        </span>
      </header>

      <main className="grid flex-1 gap-6 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        {/* Left: tutor + controls */}
        <section className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="rounded-2xl bg-gradient-to-b from-sky-100 to-amber-50 pt-6">
            <TutorCharacter tutorId={form.tutorId} getVolume={getOutputVolume} isSpeaking={isSpeaking} isLive={isLive} />
          </div>
          <p className="-mt-2 text-center text-sm font-semibold text-slate-500">
            {isLive ? (isSpeaking ? `${tutor?.name} is teaching…` : 'Your turn — speak any time') : tutor?.name ?? ' '}
          </p>

          {!isLive ? (
            <>
              <LessonForm tutors={tutors} value={form} onChange={setForm} disabled={busy} />
              <button
                onClick={startLesson}
                disabled={busy || tutors.length === 0}
                className="rounded-2xl bg-sky-600 py-3.5 text-base font-extrabold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Getting ready…' : 'Start lesson'}
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setMuted(!isMuted)}
                className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition ${
                  isMuted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isMuted ? '🎤 Unmute mic' : '🔇 Mute mic'}
              </button>
              <button
                onClick={() => conversation.endSession()}
                className="flex-1 rounded-2xl bg-rose-500 py-3.5 text-sm font-bold text-white transition hover:bg-rose-600"
              >
                End lesson
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </section>

        {/* Right: captions */}
        <section className="flex min-h-[320px] flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-slate-400">
            Lesson captions
          </h2>
          <div className="flex-1 overflow-y-auto px-5 py-4 lg:max-h-[calc(100vh-220px)]">
            <Captions messages={messages} tutorName={tutor?.name ?? 'Tutor'} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ConversationProvider>
      <Classroom />
    </ConversationProvider>
  );
}
