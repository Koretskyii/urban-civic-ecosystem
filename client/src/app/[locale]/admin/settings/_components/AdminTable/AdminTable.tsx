import type { ReactNode } from 'react';

export function AdminTable({
  minWidth,
  columns,
  headers,
  children,
}: {
  minWidth: string;
  columns: string;
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto border-y border-black/10 bg-white">
      <div className="w-full" style={{ minWidth }}>
        <div
          className={`grid ${columns} border-b border-black/10 bg-[var(--surface-2)]`}
        >
          {headers.map((header) => (
            <div
              key={header}
              className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--primary-light)]"
            >
              {header}
            </div>
          ))}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function AdminCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 px-4 py-3 align-top text-sm ${className}`}>
      {children}
    </div>
  );
}
