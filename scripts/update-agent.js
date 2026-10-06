// Syncs the agent on ElevenLabs (ELEVENLABS_AGENT_ID) with the current prompt, greeting,
// LLM and voice. Run after changing src/prompts/tutor.prompt.js or the LLM setting.
// Usage: npm run agent:update -- [tutorId]     (default: oliver)
import { updateTutorAgent } from '../src/services/tutor.service.js';

const tutorId = process.argv[2] || 'oliver';

try {
  const agent = await updateTutorAgent(tutorId);
  console.log(`Updated agent ${agent.agent_id} (LLM: ${agent.conversation_config?.agent?.prompt?.llm}).`);
} catch (err) {
  console.error('Failed to update agent:', err.message, err.details ?? '');
  process.exit(1);
}
