import Razorpay from 'razorpay';
import { config } from './index';

let _client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }
  return _client;
}
