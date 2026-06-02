import React, { useRef } from 'react';
import {
  UploadCloud,
  X,
  File as FileIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
  value?: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  accept,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combined = [...value, ...newFiles].slice(0, maxFiles);
      onChange(combined);
    }
    // Reset input so the same file can be selected again if removed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-muted'
            : 'cursor-pointer hover:bg-muted/50 border-border'
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
        />
        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">
          Натисніть для завантаження файлів
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Максимум {maxFiles} файлів
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 border rounded-md bg-card text-card-foreground shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  {isImage ? (
                    <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-gray-500 shrink-0" />
                  )}
                  <span className="text-sm truncate font-medium">
                    {file.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
