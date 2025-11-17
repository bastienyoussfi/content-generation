import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentGenerationController } from './controllers/content-generation.controller';
import { ContentGeneratorService } from './services/content-generator.service';
import { PlatformOptimizerService } from './services/platform-optimizer.service';
import { ContentValidatorService } from './services/content-validator.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { TwitterStrategy } from './strategies/twitter.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

@Module({
  imports: [ConfigModule],
  controllers: [ContentGenerationController],
  providers: [
    ContentGeneratorService,
    PlatformOptimizerService,
    ContentValidatorService,
    OpenRouterProvider,
    TwitterStrategy,
    LinkedInStrategy,
  ],
  exports: [ContentGeneratorService],
})
export class ContentGenerationModule {}
