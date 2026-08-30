import { Module } from '@nestjs/common';

import { OutboxRelay } from './outbox-relay.service.js';
import { OutboxRepository } from './outbox.repository.js';

@Module({
  providers: [OutboxRepository, OutboxRelay],
  exports: [OutboxRepository, OutboxRelay],
})
export class OutboxModule {}
