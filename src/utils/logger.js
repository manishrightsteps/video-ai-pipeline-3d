import pino from 'pino';
import config from '../config/index.js';

const logger = pino({
  level: config.logLevel,
  redact: ['req.headers.authorization', 'req.headers["xi-api-key"]', 'req.headers.cookie'],
  ...(config.isProd
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }),
});

export default logger;
