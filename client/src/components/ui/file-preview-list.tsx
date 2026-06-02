import React from 'react';
import { File as FileIcon, Download } from 'lucide-react';
import type { Attachment } from '@/types';
import { Button } from './button';

interface FilePreviewListProps {
  attachments: Attachment[];
}

export function FilePreviewList({ attachments }: FilePreviewListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const images = attachments.filter((a) => a.mimeType?.startsWith('image/'));
  const documents = attachments.filter(
    (a) => !a.mimeType?.startsWith('image/'),
  );

  return (
    <div className="space-y-4 w-full">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative aspect-square rounded-md overflow-hidden border bg-muted"
            >
              <img
                src={image.url}
                alt={image.fileName}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Download className="text-white h-6 w-6" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-sm truncate font-medium">
                  {doc.fileName}
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.fileName}
                  title="Завантажити"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
