import { registerAs } from '@nestjs/config';

export const tlsConfig = registerAs('tls', () => ({
    enabled: process.env.TLS_ENABLED === 'true',
    certPath: process.env.TLS_CERT_PATH || './certs/cert.pem',
    keyPath: process.env.TLS_KEY_PATH || './certs/key.pem',
}));
