import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { envSchema } from './env.schema.js';
import { findRootEnvFile } from './root-env-file.js';

const rootEnvFile = findRootEnvFile();

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Variaveis ja presentes no processo vencem o arquivo; o CI e os testes dependem disso.
      envFilePath: rootEnvFile === undefined ? [] : [rootEnvFile],
      validationSchema: envSchema,
    }),
  ],
})
export class ConfigModule {}
