import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CityService } from './city.service';
import { CityInitData, DomainVerificationData } from '@/types';
import { CITY_ERRORS } from '../rbac/constants/city.const';
import { JWTGuard } from '../auth/guards/jwt.guard';
import type { User } from '@/types/auth.types';

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
};

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @UseGuards(JWTGuard)
  @Post('domain/generate-token')
  generateDomainToken(@Body('domain') domain: string) {
    return this.cityService.generateDomainToken(domain);
  }

  @UseGuards(JWTGuard)
  @Get()
  async getAllCities() {
    return this.cityService.getAllCities();
  }

  @UseGuards(JWTGuard)
  @Get('creation-requests/me/current')
  async getCurrentCityCreationRequest(@Req() req: Request) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.cityService.getCurrentCityCreationRequest(user.id);
  }

  @UseGuards(JWTGuard)
  @Get(':id')
  async getCityById(@Param('id') id: string) {
    return this.cityService.getCityById(id);
  }

  @UseGuards(JWTGuard)
  @Post('domain/verify')
  async verifyDomain(@Body() body: DomainVerificationData) {
    return this.cityService.verifyDomain(body.domain, body.token);
  }

  @UseGuards(JWTGuard)
  @Post(':id/join')
  async joinCity(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.cityService.joinCity(id, user.id);
  }

  @UseGuards(JWTGuard)
  @Post('initialize')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Тільки PDF, JPG, PNG або DOC(X) формати підтримуються',
            ),
            false,
          );
          return;
        }

        cb(null, true);
      },
    }),
  )
  async initializeCity(
    @Body() data: CityInitData,
    @UploadedFile() document: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!document) {
      throw new BadRequestException(CITY_ERRORS.DOCUMENT_REQUIRED);
    }

    const centerLat = toOptionalNumber(data.centerLat);
    const centerLng = toOptionalNumber(data.centerLng);

    if (centerLat !== undefined && Number.isNaN(centerLat)) {
      throw new BadRequestException('Invalid centerLat');
    }
    if (centerLng !== undefined && Number.isNaN(centerLng)) {
      throw new BadRequestException('Invalid centerLng');
    }
    if (centerLat !== undefined && (centerLat < -90 || centerLat > 90)) {
      throw new BadRequestException('centerLat must be between -90 and 90');
    }
    if (centerLng !== undefined && (centerLng < -180 || centerLng > 180)) {
      throw new BadRequestException('centerLng must be between -180 and 180');
    }

    return this.cityService.createCityCreationRequest(
      user.id,
      {
        ...data,
        centerLat,
        centerLng,
      },
      document,
    );
  }
}
