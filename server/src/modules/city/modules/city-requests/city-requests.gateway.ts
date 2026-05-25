import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { CityRequestsService } from './city-requests.service';
import type { JwtPayload } from '@/types/auth.types';
import {
  CITY_REQUESTS_SOCKET_EVENTS,
  type CityRequestsMutationSocketEvent,
} from './city-requests.events';
import { CITY_REQUESTS_CONSTANTS } from './city-requests.constants';

export type SocketWithUser = Socket & {
  data: {
    user?: {
      id: string;
      email?: string;
    };
  };
};

type SocketUserData = {
  user?: {
    id: string;
    email?: string;
  };
};

@Injectable()
@WebSocketGateway({
  namespace: CITY_REQUESTS_CONSTANTS.SOCKET_NAMESPACE,
  cors: {
    origin: true,
    credentials: true,
  },
})
export class CityRequestsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(CityRequestsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cityRequestsService: CityRequestsService,
  ) {}

  emitMutationEvent(
    requestId: string,
    eventName: CityRequestsMutationSocketEvent,
    payload: unknown,
  ) {
    this.emitToRequestRoom(requestId, eventName, payload);
  }

  async handleConnection(client: SocketWithUser) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new ForbiddenException('Missing auth token');
      }

      const secret = this.configService.get<string>('jwt.secret');
      if (!secret) {
        throw new ForbiddenException('JWT secret is not configured');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      const socketData = client.data as unknown as SocketUserData;
      socketData.user = {
        id: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      this.logger.warn(`Socket auth failed: ${String(error)}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage(CITY_REQUESTS_SOCKET_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() body: { requestId: string },
  ) {
    const userId = this.getSocketUserId(client);

    if (!userId || !body?.requestId) {
      throw new ForbiddenException('Invalid socket user or requestId');
    }

    await this.cityRequestsService.assertRequestRoomAccess(
      body.requestId,
      userId,
    );

    const roomName = this.getRequestRoomName(body.requestId);
    await client.join(roomName);

    return {
      event: CITY_REQUESTS_SOCKET_EVENTS.ROOM_JOINED,
      data: {
        room: roomName,
      },
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = this.extractAuthToken(client.handshake.auth);
    if (authToken) {
      return this.normalizeToken(authToken);
    }

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.length > 0) {
      return this.normalizeToken(authHeader);
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookieToken = cookieHeader
      .split(';')
      .map((cookiePart) => cookiePart.trim())
      .find((cookiePart) => cookiePart.startsWith('access_token='))
      ?.split('=')[1];

    if (!cookieToken) {
      return null;
    }

    try {
      return this.normalizeToken(decodeURIComponent(cookieToken));
    } catch {
      return this.normalizeToken(cookieToken);
    }
  }

  private getRequestRoomName(requestId: string) {
    return `${CITY_REQUESTS_CONSTANTS.ROOM_PREFIX}:${requestId}`;
  }

  private emitToRequestRoom(
    requestId: string,
    eventName: string,
    payload: unknown,
  ) {
    this.server.to(this.getRequestRoomName(requestId)).emit(eventName, payload);
  }

  private normalizeToken(rawToken: string) {
    return rawToken.replace(/^Bearer\s+/i, '').trim();
  }

  private getSocketUserId(client: SocketWithUser): string | null {
    const socketData = client.data as unknown as SocketUserData;
    const user = socketData.user;
    if (!user || typeof user.id !== 'string' || user.id.length === 0) {
      return null;
    }

    return user.id;
  }

  private extractAuthToken(auth: unknown): string | null {
    if (
      typeof auth === 'object' &&
      auth !== null &&
      'token' in auth &&
      typeof (auth as { token?: unknown }).token === 'string'
    ) {
      return (auth as { token: string }).token;
    }

    return null;
  }
}
