import { unlink } from "node:fs/promises";
import { join } from "node:path";

export default async function globalSetup() {
  await unlink(join(process.cwd(), "data", "getme.db")).catch(() => undefined);
}
