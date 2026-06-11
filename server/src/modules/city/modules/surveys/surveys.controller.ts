import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { JWTGuard } from '@/modules/auth/guards/jwt.guard';
import { PermissionsGuard } from '@/modules/rbac/guards/permissions.guard';
import { RequirePermissions } from '@/modules/rbac/decorators/permissions.decorators';
import { PERMISSIONS_KEYS } from '@/modules/rbac/constants/permissions.const';
import type { RequestWithUser } from '@/types/auth.types';
import {
  CastVoteDto,
  CreateSurveyDto,
  GetSurveysQueryDto,
  UpdateSurveyDto,
} from './dto';

@Controller('city/:cityId/surveys')
@UseGuards(JWTGuard)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.SURVEY_CREATE)
  createSurvey(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateSurveyDto,
  ) {
    return this.surveysService.createSurvey(cityId, req.user.id, dto);
  }

  @Get()
  getCitySurveys(
    @Param('cityId') cityId: string,
    @Req() req: RequestWithUser,
    @Query() query: GetSurveysQueryDto,
  ) {
    return this.surveysService.getCitySurveys(cityId, req.user.id, query);
  }

  @Get(':surveyId')
  getSurveyById(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.surveysService.getSurveyById(cityId, surveyId, req.user.id);
  }

  @Patch(':surveyId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.SURVEY_UPDATE)
  updateSurvey(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveysService.updateSurvey(cityId, surveyId, req.user.id, dto);
  }

  @Post(':surveyId/close')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.SURVEY_MANAGE)
  closeSurvey(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.surveysService.closeSurvey(cityId, surveyId, req.user.id);
  }

  @Delete(':surveyId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.SURVEY_DELETE)
  softDeleteSurvey(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.surveysService.softDeleteSurvey(cityId, surveyId, req.user.id);
  }

  @Post(':surveyId/vote')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.VOTE_CREATE)
  castVote(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CastVoteDto,
  ) {
    return this.surveysService.castVote(cityId, surveyId, req.user.id, dto);
  }

  @Delete(':surveyId/vote')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSIONS_KEYS.VOTE_DELETE)
  retractVote(
    @Param('cityId') cityId: string,
    @Param('surveyId') surveyId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.surveysService.retractVote(cityId, surveyId, req.user.id);
  }
}
