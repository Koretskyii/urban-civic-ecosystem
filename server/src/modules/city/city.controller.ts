import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CityService } from './city.service';
import { CityInitData, DomainVerificationData } from '@/types';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post('domain/generate-token')
  generateDomainToken(@Body('domain') domain: string) {
    return this.cityService.generateDomainToken(domain);
  }

  @Get()
  async getAllCities() {
    return this.cityService.getAllCities();
  }

  @Get(':id')
  async getCityById(@Param('id') id: string) {
    return this.cityService.getCityById(id);
  }

  @Post('domain/verify')
  async verifyDomain(@Body() body: DomainVerificationData) {
    return this.cityService.verifyDomain(body.domain, body.token);
  }

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
      throw new BadRequestException('Завантажте документ');
    }
    return this.cityService.initializeCityEnvironment(data, document);
  }
}
