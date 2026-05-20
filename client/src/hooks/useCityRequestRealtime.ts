'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  connectCityRequestsSocket,
  joinCityRequestRoom,
  subscribeToCityRequestEvent,
} from '@/api/socket/city-requests.socket';
import {
  CITY_REQUESTS_JOIN_ROOM_EVENT,
  CITY_REQUESTS_REALTIME_EVENTS,
  invalidateCityRequestQueries,
} from '@/features/city-requests';
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

  useEffect(() => {
    if (!enabled || !cityId || !requestId) {
      return;
    }

    const socket = connectCityRequestsSocket();
    joinCityRequestRoom(requestId);

    const handleReconnect = () => {
      socket.emit(CITY_REQUESTS_JOIN_ROOM_EVENT, { requestId });
    };
    socket.on('connect', handleReconnect);

    const refetchFromRealtime = (event: CityRequestRealtimeEnvelope) => {
      if (event.requestId !== requestId) {
        return;
      }

      // REST remains source of truth for reconnect/consistency.
      invalidateCityRequestQueries(queryClient, cityId, requestId);
    };

    const subscriptions = CITY_REQUESTS_REALTIME_EVENTS.map((eventName) =>
      subscribeToCityRequestEvent(eventName, refetchFromRealtime),
    );

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      socket.off('connect', handleReconnect);
    };
  }, [enabled, cityId, requestId, queryClient]);
}
