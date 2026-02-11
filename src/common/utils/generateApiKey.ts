import crypto from 'crypto';

const API_KEY_PREFIX = 'sk_live_';
const API_KEY_BYTES = 32;

export function generateApiKey(): string {
    const randomBytes = crypto.randomBytes(API_KEY_BYTES).toString('hex');
    return `${ API_KEY_PREFIX }${ randomBytes }`;
}
