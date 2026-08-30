export interface DatabaseConnection {
  connectionString: string;
  schema: string | undefined;
}

/** Identificadores do Postgres sem aspas: o valor vai para um parametro de conexao, entao validamos. */
const SAFE_SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/;

/**
 * O `?schema=` da URL e uma convencao do Prisma que o driver `pg` nao entende. Separa os dois:
 * a URL limpa vai para o driver e o schema vai para o adapter e para o `search_path` da conexao.
 */
export function splitDatabaseUrl(databaseUrl: string): DatabaseConnection {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? undefined;
  url.searchParams.delete('schema');
  if (schema !== undefined && !SAFE_SCHEMA_NAME.test(schema)) {
    throw new Error(`schema invalido em DATABASE_URL: "${schema}"`);
  }
  return { connectionString: url.toString(), schema };
}
