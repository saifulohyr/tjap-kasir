import { neon, Pool } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL!

export const sql = neon(databaseUrl)

let globalPool: Pool | null = null

export function getPool(): Pool {
  if (!globalPool) {
    globalPool = new Pool({ connectionString: databaseUrl })
  }
  return globalPool
}

export default sql
