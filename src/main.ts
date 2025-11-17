import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('api');

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Content Generation API')
    .setDescription(
      'AI-agnostic content generation API for social media platforms. ' +
        'Generate high-quality, platform-optimized content with built-in anti-AI slop validation. ' +
        'Supports multiple AI providers through OpenRouter with free models available.',
    )
    .setVersion('1.0')
    .addTag('Content Generation', 'Endpoints for generating and managing social media content')
    .setContact(
      'Support',
      'https://github.com/yourusername/content-generation',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.yourdomain.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Content Generation API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(
    `📝 Content Generation endpoint: http://localhost:${port}/api/content-generation/generate`,
  );
  logger.log(`❤️  Health check: http://localhost:${port}/api/content-generation/health`);
}

bootstrap();
