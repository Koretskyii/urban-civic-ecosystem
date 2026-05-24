'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import {
  connectCityRequestsSocket,
  joinCityRequestRoom,
  subscribeToCityRequestEvent,
} from '@/api/socket/city-requests.socket';
import {
  CITY_REQUESTS_JOIN_ROOM_EVENT,
  CITY_REQUESTS_REALTIME_EVENTS,
  invalidateCityRequestRealtimeEventQueries,
  invalidateCityRequestQueries,
} from '@/features/city-requests';
import { isForbiddenError } from '@/features/city-requests/helpers/errors.helpers';
import type { CityRequestRealtimeEnvelope } from '@/types';

type UseCityRequestRealtimeParams = {
  cityId: string;
  requestId: string;
  enabled?: boolean;
};

export function useCityRequestRealtime({
  cityId,
  requestId,
  enabled = true,
}: UseCityRequestRealtimeParams) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !cityId || !requestId) {
      return;
    }

    const socket = connectCityRequestsSocket();
    joinCityRequestRoom(requestId);

    const handleReconnect = () => {
      socket.emit(CITY_REQUESTS_JOIN_ROOM_EVENT, { requestId });
      invalidateCityRequestQueries(queryClient, cityId, requestId);
    };
    socket.on('connect', handleReconnect);

    const handleConnectError = (error: unknown) => {
      if (isForbiddenError(error)) {
        router.replace('/forbidden');
        return;
      }

      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('forbidden') ||
          message.includes('unauthorized') ||
          message.includes('auth')
        ) {
          router.replace('/forbidden');
        }
      }
    };
    socket.on('connect_error', handleConnectError);

    const isRealtimeEnvelope = (
      event: unknown,
    ): event is CityRequestRealtimeEnvelope => {
      return (
        typeof event === 'object' &&
        event !== null &&
        'requestId' in event &&
        typeof (event as { requestId?: unknown }).requestId === 'string'
      );
    };

    const createRefetchFromRealtime =
      (eventName: (typeof CITY_REQUESTS_REALTIME_EVENTS)[number]) =>
      (event: unknown) => {
        if (!isRealtimeEnvelope(event) || event.requestId !== requestId) {
          return;
        }

        // REST remains source of truth for reconnect/consistency.
        invalidateCityRequestRealtimeEventQueries(
          queryClient,
          cityId,
          requestId,
          eventName,
        );
      };

    const subscriptions = CITY_REQUESTS_REALTIME_EVENTS.map((eventName) =>
      subscribeToCityRequestEvent(
        eventName,
        createRefetchFromRealtime(eventName),
      ),
    );

    if (socket.connected) {
      handleReconnect();
    }

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      socket.off('connect', handleReconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [enabled, cityId, requestId, queryClient, router]);
}
