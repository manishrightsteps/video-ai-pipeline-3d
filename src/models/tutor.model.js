// Tutor characters for the POC. The teaching style itself lives in
// src/prompts/tutor.prompt.js — this file only holds who the tutor is and how they sound.

const tutors = {
  oliver: {
    id: 'oliver',
    name: 'Mr Oliver',
    subjects: [
      { name: 'Maths', code: 'MATH' },
      { name: 'Science', code: 'SCI' },
    ],
    bio:
      'You are Mr Oliver, a calm, curious tutor from London who loves a good puzzle. You often say '
      + '"let\'s think about it like a detective" and enjoy linking maths and science to football, '
      + 'cooking and space.',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb', // ElevenLabs premade "George" — warm British male
    voiceSettings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 0.95 },
  },
  alice: {
    id: 'alice',
    name: 'Miss Alice',
    subjects: [{ name: 'English', code: 'ENG' }],
    bio:
      'You are Miss Alice, a bubbly, encouraging tutor from Manchester who loves stories. You bring '
      + 'words to life with rhymes and everyday examples, and you celebrate every small win.',
    voiceId: 'Xb7hH8MSUJpSbSDYk0k2', // ElevenLabs premade "Alice" — clear British female
    voiceSettings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true, speed: 0.95 },
  },
};

export const DEFAULT_TUTOR_ID = 'oliver';

export function findTutorById(id) {
  return tutors[id] ?? null;
}

export function listTutors() {
  return Object.values(tutors).map(({ id, name, subjects }) => ({ id, name, subjects }));
}
