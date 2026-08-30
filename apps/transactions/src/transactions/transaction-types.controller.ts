import { Controller, Get } from '@nestjs/common';

import { TransactionTypesService } from './transaction-types.service.js';

/** Catalogo de tipos de transferencia: alimenta o select do formulario e o filtro da listagem. */
@Controller('transaction-types')
export class TransactionTypesController {
  constructor(private readonly transactionTypes: TransactionTypesService) {}

  @Get()
  list() {
    return this.transactionTypes.list();
  }
}
