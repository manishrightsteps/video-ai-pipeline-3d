// One-time setup: creates the UK tutor agent on ElevenLabs and prints its ID.
// Usage: npm run agent:create -- [tutorId]     (default: oliver)
import { createTutorAgent } from '../src/services/tutor.service.js';

const tutorId = process.argv[2] || 'oliver';

try {
  const { agent_id: agentId } = await createTutorAgent(tutorId);
  console.log(`Created agent for tutor "${tutorId}".`);
  console.log(`Add this to your .env:\n\nELEVENLABS_AGENT_ID=${agentId}\n`);
} catch (err) {
  console.error('Failed to create agent:', err.message, err.details ?? '');
  process.exit(1);
}
