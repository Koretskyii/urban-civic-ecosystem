import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import { CityRequestsService } from './city-requests.service';
import {
  AssignCityRequestDto,
  CreateCityRequestDto,
  CreateMessageDto,
  CreateReportDto,
  GetCityRequestsQueryDto,
  UpdateCityRequestStatusDto,
} from './dto';
import { CityRequestsGateway } from './city-requests.gateway';
import {
  CITY_REQUESTS_MUTATION_EVENTS,
  type CityRequestRealtimeEnvelope,
  type CityRequestsMutationEvent,
} from './city-requests.events';

@Controller('city/:cityId')
@UseGuards(JWTGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class CityRequestsController {
  constructor(
    private readonly cityRequestsService: CityRequestsService,
    private readonly cityRequestsGateway: CityRequestsGateway,
  ) {}

  @Post('requests')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_REQUEST_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async createRequest(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateCityRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.cityRequestsService.createRequest(
      cityId,
      req.user.id,
      dto,
      files,
    );
  }

  @Get('requests')
  async getRequests(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: GetCityRequestsQueryDto,
  ) {
    return this.cityRequestsService.listRequests(cityId, req.user.id, query);
  }

  @Get('requests/:requestId')
  async getRequestDetail(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.cityRequestsService.getRequestDetail(
      cityId,
      requestId,
      req.user.id,
    );
  }

  @Patch('requests/:requestId/assign')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_REQUEST_MANAGE)
  async assignDepartment(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
    @Body() dto: AssignCityRequestDto,
  ) {
    const assignment = await this.cityRequestsService.assignDepartment(
      cityId,
      requestId,
      req.user.id,
      dto,
    );

    this.emitRealtimeEvent(requestId, 'ASSIGNMENT_UPDATED', assignment);

    return assignment;
  }

  @Patch('requests/:requestId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.CITY_REQUEST_MANAGE)
  async updateStatus(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCityRequestStatusDto,
  ) {
    const updatedRequest = await this.cityRequestsService.updateStatus(
      cityId,
      requestId,
      req.user.id,
      dto,
    );

    this.emitRealtimeEvent(requestId, 'STATUS_UPDATED', updatedRequest);

    return updatedRequest;
  }

  @Post('requests/:requestId/reports')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.REPORT_CREATE)
  @UseInterceptors(AnyFilesInterceptor())
  async createReport(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateReportDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const report = await this.cityRequestsService.createReport(
      cityId,
      requestId,
      req.user.id,
      dto,
      files,
    );

    this.emitRealtimeEvent(requestId, 'REPORT_CREATED', report);

    return report;
  }

  @Post('requests/:requestId/messages')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.MESSAGE_CREATE)
  async createMessage(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.cityRequestsService.createMessage(
      cityId,
      requestId,
      req.user.id,
      dto,
    );

    this.emitRealtimeEvent(requestId, 'MESSAGE_CREATED', message);

    return message;
  }

  @Get('requests/:requestId/messages')
  async getMessages(
    @Param('cityId') cityId: string,
    @Param('requestId') requestId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.cityRequestsService.getMessages(cityId, requestId, req.user.id);
  }

  private buildRealtimeEnvelope(requestId: string, payload: unknown) {
    // REST endpoints are source of truth; websocket events carry lightweight change notifications.
    return {
      requestId,
      emittedAt: new Date().toISOString(),
      payload,
    } satisfies CityRequestRealtimeEnvelope;
  }

  // Centralized mapping keeps realtime contract consistent across all REST emit points.
  private emitRealtimeEvent(
    requestId: string,
    event: CityRequestsMutationEvent,
    payload: unknown,
  ) {
    const envelope = this.buildRealtimeEnvelope(requestId, payload);
    this.cityRequestsGateway.emitMutationEvent(
      requestId,
      CITY_REQUESTS_MUTATION_EVENTS[event],
      envelope,
    );
  }
}
