import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "../shared/schema";

const SALT_ROUNDS = 12;

async function migratePasswords() {
  const allUsers = await db.select({ id: users.id, password: users.password }).from(users);
  let migrated = 0;
  let skipped = 0;

  for (const user of allUsers) {
    const isBcryptHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
    if (isBcryptHash) {
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
    await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));
    migrated++;
    console.log(`Migrated user ${user.id}`);
  }

  console.log(`Done. Migrated: ${migrated}, Already hashed: ${skipped}`);
  process.exit(0);
}

migratePasswords().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
