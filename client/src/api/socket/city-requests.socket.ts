'use client';

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config';
import {
  CITY_REQUESTS_JOIN_ROOM_EVENT,
  CITY_REQUESTS_SOCKET_NAMESPACE,
} from '@/features/city-requests';
import { useAuthStore } from '@/store';
import type {
  CityRequestRealtimeEnvelope,
  CityRequestRealtimeEvent,
} from '@/types';

let cityRequestsSocket: Socket | null = null;

function getSocketUrl() {
  return API_BASE_URL;
}

function getAuthToken() {
  return useAuthStore.getState().token;
}

export function getCityRequestsSocket() {
  if (cityRequestsSocket) {
    return cityRequestsSocket;
  }

  cityRequestsSocket = io(
    `${getSocketUrl()}${CITY_REQUESTS_SOCKET_NAMESPACE}`,
    {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
      },
    },
  );

  return cityRequestsSocket;
}

export function connectCityRequestsSocket() {
  const socket = getCityRequestsSocket();

  socket.auth = {
    token: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined,
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectCityRequestsSocket() {
  if (cityRequestsSocket) {
    cityRequestsSocket.disconnect();
    cityRequestsSocket = null;
  }
}

export function joinCityRequestRoom(requestId: string) {
  const socket = connectCityRequestsSocket();
  socket.emit(CITY_REQUESTS_JOIN_ROOM_EVENT, { requestId });
  return socket;
}

export function subscribeToCityRequestEvent(
  event: CityRequestRealtimeEvent,
  callback: (payload: CityRequestRealtimeEnvelope) => void,
) {
  const socket = connectCityRequestsSocket();
  socket.on(event, callback);

  return () => {
    socket.off(event, callback);
  };
}
