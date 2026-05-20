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
import { CITY_REQUESTS_SOCKET_EVENTS } from './city-requests.events';
import { CITY_REQUESTS_CONSTANTS } from './city-requests.constants';

type SocketWithUser = Socket & {
  data: {
    user?: {
      id: string;
      email?: string;
    };
  };
};

@Injectable()
@WebSocketGateway({
  namespace: '/city-requests',
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

  emitMessageCreated(requestId: string, payload: unknown) {
    this.emitToRequestRoom(
      requestId,
      CITY_REQUESTS_SOCKET_EVENTS.MESSAGE_CREATED,
      payload,
    );
  }

  emitReportCreated(requestId: string, payload: unknown) {
    this.emitToRequestRoom(
      requestId,
      CITY_REQUESTS_SOCKET_EVENTS.REPORT_CREATED,
      payload,
    );
  }

  emitStatusUpdated(requestId: string, payload: unknown) {
    this.emitToRequestRoom(
      requestId,
      CITY_REQUESTS_SOCKET_EVENTS.STATUS_UPDATED,
      payload,
    );
  }

  emitAssignmentUpdated(requestId: string, payload: unknown) {
    this.emitToRequestRoom(
      requestId,
      CITY_REQUESTS_SOCKET_EVENTS.ASSIGNMENT_UPDATED,
      payload,
    );
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

      client.data.user = {
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
    const userId = client.data.user?.id;

    if (!userId || !body?.requestId) {
      throw new ForbiddenException('Invalid socket user or requestId');
    }

    await this.cityRequestsService.assertRequestRoomAccess(body.requestId, userId);

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
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : null;
    if (authToken) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.length > 0) {
      return authHeader.replace(/^Bearer\s+/i, '').trim();
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

    return cookieToken ?? null;
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
}
