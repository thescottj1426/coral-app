'use server';

import { pool } from '@/lib/db';

export type HomeStats = {
  specimens: number;
  chains: number;
  keepers: number;
  farms: number;
  loggedToday: number;
};

export type DeepestChain = {
  rootRfCode: string | null;
  tipRfCode: string | null;
  tipId: string;
  name: string;
  species: string | null;
  origin: string | null;
  depth: number;
} | null;

export type TopKeeper = {
  username: string;
  displayName: string | null;
  frags: number;
  corals: number;
};

export async function getHomeStats(): Promise<HomeStats> {
  const { rows } = await pool.query<HomeStats>(
    `SELECT
       (SELECT COUNT(*)::int FROM public."Coral")                     AS specimens,
       (SELECT COUNT(*)::int FROM public."Lineage")                   AS chains,
       (SELECT COUNT(DISTINCT "ownerId")::int FROM public."Coral"
          WHERE "ownerId" IS NOT NULL)                                AS keepers,
       (SELECT COUNT(*)::int FROM public."User" WHERE "isSeller")      AS farms,
       (SELECT COUNT(*)::int FROM public."Coral"
          WHERE "createdAt" > NOW() - INTERVAL '24 hours')            AS "loggedToday"`
  );
  return rows[0] ?? { specimens: 0, chains: 0, keepers: 0, farms: 0, loggedToday: 0 };
}

/** The longest unbroken cutting chain in the app — the hero's proof of concept. */
export async function getDeepestChain(): Promise<DeepestChain> {
  const { rows } = await pool.query<DeepestChain & object>(
    `WITH RECURSIVE chain AS (
       SELECT "childId" AS tip, "parentId" AS root, 1 AS depth
       FROM public."Lineage"
       UNION ALL
       SELECT c.tip, l."parentId", c.depth + 1
       FROM chain c JOIN public."Lineage" l ON l."childId" = c.root
       WHERE c.depth < 20
     ),
     deepest AS (
       SELECT tip, root, depth FROM chain ORDER BY depth DESC, tip LIMIT 1
     )
     SELECT tipc."rfCode" AS "tipRfCode",
            rootc."rfCode" AS "rootRfCode",
            tipc.id        AS "tipId",
            tipc.name,
            tipc.species,
            tipc.origin,
            d.depth
     FROM deepest d
     JOIN public."Coral" tipc  ON tipc.id  = d.tip
     JOIN public."Coral" rootc ON rootc.id = d.root`
  );
  return rows[0] ?? null;
}

export async function getTopKeepers(limit = 5): Promise<TopKeeper[]> {
  const { rows } = await pool.query<TopKeeper>(
    `SELECT u.username,
            u."displayName",
            COUNT(l.id)::int                     AS frags,
            COUNT(DISTINCT c.id)::int            AS corals
     FROM public."User" u
     JOIN public."Coral" c   ON c."ownerId" = u.id
     LEFT JOIN public."Lineage" l ON l."parentId" = c.id
     GROUP BY u.username, u."displayName"
     ORDER BY frags DESC, corals DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export type HomeActivity = {
  id: string;
  rfCode: string | null;
  coralId: string;
  name: string;
  event: string;
  who: string | null;
  createdAt: string;
};

/**
 * Global lineage activity for the public landing page.
 *
 * Deliberately NOT getFeedItems: that reads the session via headers(), which
 * opts the whole page out of static rendering. The home feed is public and
 * unpersonalised, so it needs no session at all.
 */
export async function getHomeActivity(limit = 6): Promise<HomeActivity[]> {
  const { rows } = await pool.query<HomeActivity>(
    `SELECT l.id::text                       AS id,
            child."rfCode"                   AS "rfCode",
            child.id                         AS "coralId",
            child.name,
            'Frag cut and passed to a new keeper' AS event,
            u.username                       AS who,
            l."createdAt"                    AS "createdAt"
     FROM public."Lineage" l
     JOIN public."Coral" child ON child.id = l."childId"
     LEFT JOIN public."User" u ON u.id = child."ownerId"

     UNION ALL

     SELECT c.id                             AS id,
            c."rfCode"                       AS "rfCode",
            c.id                             AS "coralId",
            c.name,
            'New specimen logged'            AS event,
            u.username                       AS who,
            c."createdAt"                    AS "createdAt"
     FROM public."Coral" c
     JOIN public."User" u ON u.id = c."ownerId"

     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
