import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config/app.config.js";
import { jwtConfig } from "./config/jwt.config.js";
import { dbConfig } from "./config/db.config.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./modules/index.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, jwtConfig, dbConfig],
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
