import { registerAs } from '@nestjs/config';

export const r2Config = registerAs('r2', () => {
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFARE_R2_ACCOUNT_ID;
  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.BUCKET_NAME;

  return {
    accountId,
    accessKeyId:
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFARE_R2_TOKEN,
    secretAccessKey:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.CLOUDFARE_R2_SECRET_KEY,
    bucketName,
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    publicBaseUrl:
      process.env.CLOUDFARE_R2_PUBLIC_URL ||
      (accountId && bucketName
        ? `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`
        : ''),
  };
});
