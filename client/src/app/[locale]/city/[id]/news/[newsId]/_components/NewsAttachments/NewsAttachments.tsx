import { Attachment } from '@/types';
import { Download, File } from 'lucide-react';
import Image from 'next/image';

export default function NewsAttachments({
  attachments,
}: {
  attachments: Attachment[];
}) {
  const images = attachments.filter((item) =>
    item.mimeType?.startsWith('image/'),
  );
  const documents = attachments.filter(
    (item) => !item.mimeType?.startsWith('image/'),
  );

  return (
    <div className="h-fit space-y-3">
      {images.map((image) => (
        <a
          key={image.id}
          href={image.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-black/10 bg-[var(--surface-2)]"
        >
          <Image
            src={image.url}
            alt={image.fileName}
            fill
            sizes="(min-width: 1280px) 320px, 100vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-2 right-2 inline-flex rounded-md bg-black/55 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Download size={18} />
          </span>
        </a>
      ))}

      {documents.map((document) => (
        <a
          key={document.id}
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          download={document.fileName}
          className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-3 py-3 text-sm transition hover:bg-[var(--secondary)]/8"
        >
          <span className="flex min-w-0 items-center gap-2">
            <File size={18} className="shrink-0 text-[var(--secondary)]" />
            <span className="truncate font-medium text-[var(--primary)]">
              {document.fileName}
            </span>
          </span>
          <Download
            size={16}
            className="shrink-0 text-[var(--primary-light)]"
          />
        </a>
      ))}
    </div>
  );
}
