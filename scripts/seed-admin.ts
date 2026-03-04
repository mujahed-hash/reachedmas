import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = "admin@reachmasked.com";
    const password = "ReachAdminPassword123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating default admin: ${email}`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: "ADMIN",
            passwordHash: hashedPassword,
            plan: "PREMIUM"
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: "ADMIN",
            plan: "PREMIUM",
            name: "Default Admin"
        }
    });

    console.log(`Successfully created/updated admin: ${user.email}`);
    console.log(`Credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
