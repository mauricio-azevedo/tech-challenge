export interface DatabaseConnection {
  connectionString: string;
  schema: string | undefined;
}

/**
 * O `?schema=` da URL e uma convencao do Prisma que o driver `pg` nao entende. Separa os dois:
 * a URL limpa vai para o driver e o schema vai para o adapter, que ajusta o `search_path`.
 */
export function splitDatabaseUrl(databaseUrl: string): DatabaseConnection {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? undefined;
  url.searchParams.delete('schema');
  return { connectionString: url.toString(), schema };
}
