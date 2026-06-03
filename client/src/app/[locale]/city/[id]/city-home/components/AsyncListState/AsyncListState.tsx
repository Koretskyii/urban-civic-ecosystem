import type { AsyncListStateProps } from '../../types/CityHomeView.types';
import { StateMessage } from '../StateMessage/StateMessage';

export function AsyncListState({
  enabled,
  isLoading,
  isError,
  empty,
  disabledText,
  emptyText,
  errorText,
  children,
}: AsyncListStateProps) {
  if (!enabled) return <StateMessage text={disabledText} />;
  if (isLoading) return <StateMessage text="Loading..." />;
  if (isError) return <StateMessage text={errorText} tone="danger" />;
  if (empty) return <StateMessage text={emptyText} />;
  return <>{children}</>;
}
