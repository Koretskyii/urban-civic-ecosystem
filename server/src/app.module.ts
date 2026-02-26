import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config/app.config.js";
import { jwtConfig } from "./config/jwt.config.js";
import { dbConfig } from "./config/db.config.js";
import { tlsConfig } from "./config/tls.config.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./modules/index.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { RbacModule } from "./modules/rbac/rbac.module.js";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, dbConfig, tlsConfig],
    }),
    PrismaModule,
    AuthModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
