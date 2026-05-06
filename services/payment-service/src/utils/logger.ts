import pino from 'pino';
import { config } from '../config';
export const logger = pino({ level: config.NODE_ENV === 'production' ? 'info' : 'debug', base: { service: 'payment-service' }, ...(config.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty', options: { colorize: true } } }) });
