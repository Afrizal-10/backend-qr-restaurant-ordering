import "dotenv/config";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedAdminPassword = await bcrypt.hash("password123", 10);
  const hashedCashierPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: {email: "admin@restoku.com"},
    update: {},
    create: {
      name: "Admin Restoku",
      email: "admin@restoku.com",
      password: hashedAdminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const cashier = await prisma.user.upsert({
    where: {email: "cashier@restoku.com"},
    update: {},
    create: {
      name: "Cashier Restoku",
      email: "cashier@restoku.com",
      password: hashedCashierPassword,
      role: "CASHIER",
      status: "ACTIVE",
    },
  });

  console.log("Seed berhasil:");
  console.log("- Admin:", admin.email, "(password: password123)");
  console.log("- Cashier:", cashier.email, "(password: password123)");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
