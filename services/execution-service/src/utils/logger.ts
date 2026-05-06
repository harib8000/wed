import pino from 'pino';
import { config } from '../config';
export const logger = pino({ level: 'debug', base: { service: 'execution-service' }, ...(config.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty', options: { colorize: true } } }) });
