import { z } from 'zod';

const voiceSettings = z
  .object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    style: z.number().min(0).max(1),
    use_speaker_boost: z.boolean(),
    speed: z.number().min(0.7).max(1.2),
  })
  .partial()
  .strict();

export const tutorIdParams = z.object({
  tutorId: z.string().trim().min(1).max(50),
});

export const speakBody = z.object({
  text: z.string().trim().min(1, 'text is required').max(2500, 'text must be 2500 characters or fewer'),
  voiceSettings: voiceSettings.optional(),
});

// Mirrors the session metadata the main RightSteps backend passes to its LiveKit tutor.
export const sessionBody = z
  .object({
    transport: z.enum(['websocket', 'webrtc']).default('websocket'),
    tutorId: z.string().trim().min(1).max(50).default('oliver'),
    subjectCode: z.string().trim().toUpperCase().max(20).optional(),
    examBoard: z.enum(['AQA', 'EDEXCEL', 'OCR', 'WJEC', 'CAMBRIDGE', 'IB']).optional(),
    learningMode: z
      .enum(['ADAPTIVE', 'GUIDE_ME', 'LET_ME_EXPLORE', 'MAKE_IT_INTERESTING', 'CHALLENGE_ME'])
      .default('ADAPTIVE'),
    topic: z.string().trim().max(200).optional(),
    student: z
      .object({
        name: z.string().trim().min(1).max(50).default('there'),
        age: z.number().int().min(4).max(19).optional(),
        yearGroup: z.string().trim().regex(/^YEAR_\d{1,2}$/, 'yearGroup must look like YEAR_5').optional(),
        keyStage: z.enum(['KS1', 'KS2', 'KS3', 'KS4']).default('KS2'),
        specialNeeds: z.array(z.enum(['DYSLEXIA', 'ADHD', 'AUTISM', 'DYSPRAXIA', 'OTHER'])).max(5).default([]),
      })
      .prefault({}),
  })
  .prefault({}); // prefault (not default) so inner field defaults still apply in Zod 4
