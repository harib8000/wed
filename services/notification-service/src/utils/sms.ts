import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function sendSms(phone: string, message: string): Promise<string> {
  if (!config.MSG91_AUTH_KEY) {
    logger.info({ phone, message }, '[SMS stub] SMS not sent (MSG91_AUTH_KEY not set)');
    return 'stub-sms-id';
  }

  const response = await axios.post(
    'https://api.msg91.com/api/v5/flow/',
    {
      template_id: 'your-template-id', // override per-call
      short_url: '0',
      mobiles: phone.replace('+', ''),
      VAR1: message,
    },
    {
      headers: {
        authkey: config.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data?.request_id ?? 'sent';
}

export async function sendWhatsApp(phone: string, templateName: string, params: string[]): Promise<string> {
  if (!config.MSG91_AUTH_KEY || !config.MSG91_WHATSAPP_NUMBER) {
    logger.info({ phone, templateName }, '[WhatsApp stub] Not sent (credentials not set)');
    return 'stub-wa-id';
  }

  const response = await axios.post(
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      integrated_number: config.MSG91_WHATSAPP_NUMBER,
      content_type: 'template',
      payload: {
        to: phone.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: p })) }],
        },
      },
    },
    { headers: { authkey: config.MSG91_AUTH_KEY, 'Content-Type': 'application/json' } }
  );

  return response.data?.request_id ?? 'sent';
}
