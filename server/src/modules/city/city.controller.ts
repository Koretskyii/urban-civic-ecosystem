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
  ) {
    if (!document) {
      throw new BadRequestException(CITY_ERRORS.DOCUMENT_REQUIRED);
    }
    return this.cityService.initializeCityEnvironment(data, document);
  }
}
