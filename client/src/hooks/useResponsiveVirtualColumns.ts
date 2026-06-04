'use client';

import { useEffect, useState } from 'react';

export function useResponsiveVirtualColumns(
  breakpoints: ReadonlyArray<{ minWidth: number; columns: number }>,
  defaultColumns = 1,
) {
  const [columns, setColumns] = useState(defaultColumns);

  useEffect(() => {
    const computeColumns = () => {
      const width = window.innerWidth;
      const nextColumns =
        [...breakpoints]
          .sort((a, b) => b.minWidth - a.minWidth)
          .find((item) => width >= item.minWidth)?.columns ?? defaultColumns;
      setColumns(nextColumns);
    };

    computeColumns();
    window.addEventListener('resize', computeColumns);
    return () => window.removeEventListener('resize', computeColumns);
  }, [breakpoints, defaultColumns]);

  return columns;
}
