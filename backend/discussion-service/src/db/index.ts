import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, disconnecting from database...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, disconnecting from database...");
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
