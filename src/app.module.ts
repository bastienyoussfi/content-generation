import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentGenerationModule } from './content-generation/content-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ContentGenerationModule,
  ],
})
export class AppModule {}
