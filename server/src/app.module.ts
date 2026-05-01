import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { dbConfig } from './config/db.config';
import { tlsConfig } from './config/tls.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/index';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RbacModule } from './modules/rbac/rbac.module';
import { googleConfig } from './config/google.config';
import { CityModule } from './modules/city/city.module';
import { r2Config } from './config/r2.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, dbConfig, tlsConfig, googleConfig, r2Config],
    }),
    PrismaModule,
    AuthModule,
    RbacModule,
    CityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
