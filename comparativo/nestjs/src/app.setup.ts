import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { fabricaErrores } from './errores';

export function configurar(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, exceptionFactory: fabricaErrores }));
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Comparativo - NestJS').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('docs', app, doc, { jsonDocumentUrl: 'openapi.json' });
}
