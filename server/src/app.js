import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: '1mb' }));

  return app;
}
