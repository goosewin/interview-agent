import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql as NeonQueryFunction<boolean, boolean>, { schema });

// Helper to use in edge functions
export const createClient = () => {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql as NeonQueryFunction<boolean, boolean>, { schema });
};
