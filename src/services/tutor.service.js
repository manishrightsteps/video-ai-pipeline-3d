import { Readable } from 'node:stream';
import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';
import * as elevenlabs from './elevenlabs.service.js';
import { DEFAULT_TUTOR_ID, findTutorById, listTutors } from '../models/tutor.model.js';
import { buildTutorGreeting, buildTutorSystemPrompt } from '../prompts/tutor.prompt.js';

function resolveTutor(tutorId = DEFAULT_TUTOR_ID) {
  const tutor = findTutorById(tutorId);
  if (!tutor) throw ApiError.notFound(`Tutor "${tutorId}" not found`);
  return tutor;
}

function ttsParams(tutor, text, overrides = {}) {
  return {
    text,
    voiceId: tutor.voiceId || config.elevenlabs.voiceId,
    modelId: config.elevenlabs.modelId,
    outputFormat: config.elevenlabs.outputFormat,
    voiceSettings: { ...tutor.voiceSettings, ...overrides.voiceSettings },
  };
}

export function getTutors() {
  return listTutors();
}

export function getTutor(tutorId) {
  const { voiceSettings, voiceId, ...publicFields } = resolveTutor(tutorId);
  return publicFields;
}

/** Returns a Node Readable of MP3 audio for the tutor speaking `text`. */
export async function speakStream({ tutorId, text, voiceSettings, signal }) {
  const tutor = resolveTutor(tutorId);
  const upstream = await elevenlabs.streamSpeech({ ...ttsParams(tutor, text, { voiceSettings }), signal });
  return {
    contentType: upstream.headers.get('content-type') || 'audio/mpeg',
    stream: Readable.fromWeb(upstream.body),
  };
}

/** Audio + alignment data for driving the character's mouth / subtitles. */
export async function speakWithTimestamps({ tutorId, text, voiceSettings, signal }) {
  const tutor = resolveTutor(tutorId);
  const data = await elevenlabs.speechWithTimestamps({ ...ttsParams(tutor, text, { voiceSettings }), signal });
  return {
    audioBase64: data.audio_base64,
    alignment: data.alignment,
    normalizedAlignment: data.normalized_alignment,
  };
}

function requireAgentId(agentId) {
  const id = agentId || config.elevenlabs.agentId;
  if (!id) throw ApiError.serviceUnavailable('Voice agent is not configured (ELEVENLABS_AGENT_ID missing)');
  return id;
}

function resolveSubject(tutor, subjectCode) {
  if (!subjectCode) return tutor.subjects[0];
  const subject = tutor.subjects.find((sub) => sub.code === subjectCode);
  if (!subject) {
    const codes = tutor.subjects.map((sub) => sub.code).join(', ');
    throw ApiError.badRequest(`${tutor.name} does not teach "${subjectCode}" (teaches: ${codes})`);
  }
  return subject;
}

/** Builds the full RightSteps teaching prompt + greeting for one student's session. */
export function buildSessionPrompt({ tutorId, subjectCode, examBoard, learningMode, topic, student }) {
  const tutor = resolveTutor(tutorId);
  const subject = resolveSubject(tutor, subjectCode);

  const prompt = buildTutorSystemPrompt({
    tutorName: tutor.name,
    tutorSubject: subject.name,
    tutorSubjectCode: subject.code,
    tutorBio: tutor.bio,
    childName: student.name,
    age: student.age,
    yearGroup: student.yearGroup,
    keyStage: student.keyStage,
    topic,
    examBoard,
    specialNeeds: student.specialNeeds,
    learningMode,
  });

  // ElevenLabs treats any {{...}} as a runtime dynamic variable and rejects the
  // conversation if it is not supplied — fail loudly here instead.
  if (/\{\{\w+\}\}/.test(prompt)) throw new Error('Tutor prompt contains unfilled {{placeholders}}');

  const firstMessage = buildTutorGreeting({
    tutorName: tutor.name,
    childName: student.name,
    tutorSubject: subject.name,
    yearGroup: student.yearGroup,
  });

  return { tutor, prompt, firstMessage };
}

/**
 * Starts a live voice session. Returns the signed URL (or WebRTC token) plus the
 * per-student overrides the frontend must pass to the ElevenLabs SDK's startSession.
 */
export async function startSession({ transport = 'websocket', ...sessionInput }) {
  const agentId = requireAgentId();
  const { tutor, prompt, firstMessage } = buildSessionPrompt(sessionInput);

  const overrides = {
    agent: { prompt: { prompt }, firstMessage, language: 'en' },
    tts: { voiceId: tutor.voiceId },
  };

  if (transport === 'webrtc') {
    const { token } = await elevenlabs.getConversationToken(agentId);
    return { transport, agentId, conversationToken: token, overrides };
  }
  const { signed_url: signedUrl } = await elevenlabs.getConversationSignedUrl(agentId);
  return { transport, agentId, signedUrl, overrides };
}

/** Builds the ElevenLabs agent config. The prompt here is only a fallback — each session overrides it. */
export function buildAgentPayload(tutorId) {
  const { tutor, prompt, firstMessage } = buildSessionPrompt({
    tutorId,
    learningMode: 'ADAPTIVE',
    student: { name: 'there', keyStage: 'KS2', specialNeeds: [] },
  });

  return {
    name: 'RightSteps UK Tutor (POC)',
    conversation_config: {
      agent: {
        first_message: firstMessage,
        language: 'en',
        prompt: {
          prompt,
          llm: config.elevenlabs.agentLlm,
          temperature: 0.6,
        },
      },
      tts: {
        voice_id: tutor.voiceId,
        model_id: 'eleven_flash_v2',
        stability: tutor.voiceSettings.stability,
        similarity_boost: tutor.voiceSettings.similarity_boost,
        speed: tutor.voiceSettings.speed,
      },
      // Filter out TV / other people in the room so their speech isn't taken as the child's.
      vad: { background_voice_detection: true },
    },
    // Allow the per-session prompt, greeting and tutor voice to be set at session start.
    platform_settings: {
      // Only signed URLs / tokens from this backend can start a conversation.
      auth: { enable_auth: true },
      overrides: {
        conversation_config_override: {
          agent: { prompt: { prompt: true }, first_message: true, language: true },
          tts: { voice_id: true },
        },
      },
    },
  };
}

/** Pushes the current prompt, greeting, LLM and voice to the existing agent. */
export async function updateTutorAgent(tutorId) {
  return elevenlabs.updateAgent(requireAgentId(), buildAgentPayload(tutorId));
}

export async function createTutorAgent(tutorId) {
  return elevenlabs.createAgent(buildAgentPayload(tutorId));
}

export async function getVoices() {
  const { voices = [] } = await elevenlabs.listVoices();
  return voices.map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
    previewUrl: v.preview_url,
  }));
}
