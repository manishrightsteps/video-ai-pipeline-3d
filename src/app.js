import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import config from './config/index.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind a load balancer / reverse proxy

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-request-id'] || randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
  }),
);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (curl, server-to-server) and whitelisted origins.
      if (!origin || config.cors.origins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
    maxAge: 600,
  }),
);
// Don't compress audio — it's already compressed and buffering would add latency.
app.use(compression({ filter: (req, res) => !String(res.getHeader('Content-Type') || '').startsWith('audio/') && compression.filter(req, res) }));
app.use(express.json({ limit: '20kb' }));

app.use('/api', apiLimiter);
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
