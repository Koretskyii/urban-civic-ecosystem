import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ContentCardProps } from '../../types/CityHomeView.types';

export function ContentCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  children,
}: ContentCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex rounded-lg bg-[var(--secondary)]/12 p-2 text-[var(--secondary)]">
              {icon}
            </span>
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="shrink-0"
        >
          {actionLabel}
          <ArrowRight size={15} className="ml-1" />
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
