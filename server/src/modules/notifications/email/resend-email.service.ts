import { Injectable, Logger } from '@nestjs/common';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class ResendEmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  async send(input: SendEmailInput) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (!from) {
      throw new Error('EMAIL_FROM is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      this.logger.warn(
        `Resend failed status=${response.status} details=${details.slice(0, 300)}`,
      );
      throw new Error(
        `Resend email failed with status ${response.status}${
          details ? `: ${details.slice(0, 300)}` : ''
        }`,
      );
    }
    return { ok: true };
  }
}
