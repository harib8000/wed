import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'user-service', env: config.NODE_ENV },
  redact: ['req.headers.authorization', 'body.password'],
  ...(config.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});
