import type {
  TransactionResponse,
  TransactionStatsResponse,
  TransactionTypeResponse,
} from '@challenge/contracts';

export const transactionTypes: TransactionTypeResponse[] = [
  { id: 1, name: 'TED' },
  { id: 2, name: 'PIX' },
  { id: 3, name: 'DOC' },
];

let sequence = 0;

export function buildTransaction(
  overrides: Partial<TransactionResponse> = {},
): TransactionResponse {
  sequence += 1;
  const suffix = String(sequence).padStart(12, '0');
  return {
    transactionExternalId: `0191c2f0-3a4b-7c5d-8e6f-${suffix}`,
    accountExternalIdDebit: '3f2b1d3e-8c4a-4f6e-9a1b-2c3d4e5f6a7b',
    accountExternalIdCredit: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
    transactionType: { id: 2, name: 'PIX' },
    transactionStatus: { name: 'PENDING' },
    value: 120,
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

export function buildStats(
  overrides: Partial<TransactionStatsResponse> = {},
): TransactionStatsResponse {
  return {
    total: 0,
    byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0 },
    approvedVolume: 0,
    ...overrides,
  };
}

export function page(
  data: TransactionResponse[],
  total = data.length,
  pageNumber = 1,
  pageSize = 20,
) {
  return { data, page: pageNumber, pageSize, total };
}
