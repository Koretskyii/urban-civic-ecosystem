import { Controller, Post, Body } from '@nestjs/common';
import { CityService } from './city.service';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post('domain/generate-token')
  generateDomainToken(@Body('domain') domain: string) {
    return this.cityService.generateDomainToken(domain);
  }

  @Post('domain/verify')
  async verifyDomain(@Body() body: { domain: string; token: string }) {
    return this.cityService.verifyDomain(body.domain, body.token);
  }
}
