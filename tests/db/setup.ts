import { afterAll, beforeAll } from "vitest";
import { pool } from "./helpers";

beforeAll(async () => {
  try {
    await pool.query("select 1");
  } catch (e) {
    throw new Error(
      "Локал Supabase Postgres-т холбогдож чадсангүй. `pnpm db:start` ажиллуулсан эсэхээ шалгана уу.\n" +
        String(e),
    );
  }
});

afterAll(async () => {
  await pool.end();
});
