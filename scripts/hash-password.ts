/**
 * Utility to hash a password for ADMIN_PASSWORD_HASH env var.
 * Usage: tsx scripts/hash-password.ts <password>
 */
import "dotenv/config";
import { hash } from "bcryptjs";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: tsx scripts/hash-password.ts <password>");
    process.exit(1);
  }
  const hashed = await hash(password, 12);
  console.log("\nPassword hash:");
  console.log(hashed);
  console.log("\nAdd to .env:");
  console.log(`ADMIN_PASSWORD_HASH="${hashed}"\n`);
}

main();
