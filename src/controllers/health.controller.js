import config from '../config/index.js';

export function health(_req, res) {
  res.json({
    success: true,
    data: {
      status: 'ok',
      env: config.env,
      uptime: Math.round(process.uptime()),
      agentConfigured: Boolean(config.elevenlabs.agentId),
    },
  });
}
