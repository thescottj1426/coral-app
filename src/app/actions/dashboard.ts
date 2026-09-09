'use server';

import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/getCurrentUser';

export type DashboardStats = {
  coralCount: number;
  fragsProduced: number;
  fragsReceived: number;
};


export type MyListing = {
  id: string;
  coralId: string;
  coralName: string;
  identityHue: number | null;
  price: number | null;
  qty: number | null;
};

// No userId parameter: these are 'use server' exports, so a parameter is an
// argument any caller can supply — including one asking about someone else.
export async function getDashboardStats(): Promise<DashboardStats> {
  const { id: userId } = await getCurrentUser();
  const { rows } = await pool.query<DashboardStats>(
    `SELECT
       (SELECT COUNT(*)::int FROM public."Coral" WHERE "ownerId" = $1) AS "coralCount",
       (SELECT COUNT(*)::int FROM public."Lineage" l
        JOIN public."Coral" c ON c.id = l."parentId" WHERE c."ownerId" = $1) AS "fragsProduced",
       (SELECT COUNT(*)::int FROM public."Lineage" l
        JOIN public."Coral" c ON c.id = l."childId" WHERE c."ownerId" = $1) AS "fragsReceived"`,
    [userId]
  );
  return rows[0];
}



export async function getMyListings(): Promise<MyListing[]> {
  const { id: userId } = await getCurrentUser();
  const { rows } = await pool.query<MyListing>(
    `SELECT fl.id, fl."coralId", c.name AS "coralName", c."identityHue",
            fl.price, fl.qty
     FROM public."FragListing" fl
     JOIN public."Coral" c ON c.id = fl."coralId"
     WHERE fl."userId" = $1
     ORDER BY fl."createdAt" DESC
     LIMIT 5`,
    [userId]
  );
  return rows;
}
