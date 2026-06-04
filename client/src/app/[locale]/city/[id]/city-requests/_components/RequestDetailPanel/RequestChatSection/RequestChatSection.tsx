'use client';

import type { FormEvent } from 'react';
import type { CityRequestMessage } from '@/types';

interface RequestChatSectionProps {
  title: string;
  messages: CityRequestMessage[];
  messageValue: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSendingMessage: boolean;
  isMessageError: boolean;
  messageFailedLabel: string;
  messagePlaceholder: string;
  sendLabel: string;
}

export function RequestChatSection(props: RequestChatSectionProps) {
  const {
    title,
    messages,
    messageValue,
    onMessageChange,
    onSendMessage,
    isSendingMessage,
    isMessageError,
    messageFailedLabel,
    messagePlaceholder,
    sendLabel,
  } = props;

  return (
    <>
      <p className="text-base font-semibold">{title}</p>
      {isMessageError ? (
        <p className="rounded-md border border-[var(--danger-light)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger-dark)]">
          {messageFailedLabel}
        </p>
      ) : null}
      <div className="max-h-[220px] overflow-auto pr-1">
        <div className="space-y-2">
          {messages.map((item) => (
            <div key={item.id}>
              <p className="text-sm font-semibold">{item.author.name}</p>
              <p className="text-sm">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSendMessage} className="flex gap-2">
        <input
          value={messageValue}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder={messagePlaceholder}
          className="h-9 w-full rounded-md border border-black/15 px-3 text-sm outline-none focus:border-[var(--secondary)]"
        />
        <button
          type="submit"
          disabled={isSendingMessage}
          className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sendLabel}
        </button>
      </form>
    </>
  );
}
