import { prisma } from "../src/lib/db";

async function main() {
    // Create a demo user
    const user = await prisma.user.upsert({
        where: { email: "demo@reachmasked.com" },
        update: {},
        create: {
            email: "demo@reachmasked.com",
            passwordHash: "hashed_password_placeholder",
            phoneEncrypted: "encrypted_phone_placeholder",
            role: "OWNER",
        },
    });

    console.log("Created user:", user.publicId);

    // Create a demo vehicle
    const vehicle = await prisma.vehicle.upsert({
        where: { publicId: "demo-vehicle-001" },
        update: {},
        create: {
            publicId: "demo-vehicle-001",
            ownerId: user.id,
            model: "Toyota Camry",
            color: "Silver",
            licensePlateHash: "hashed_license_plate",
        },
    });

    console.log("Created vehicle:", vehicle.publicId);

    // Create a demo tag
    const tag = await prisma.tag.upsert({
        where: { shortCode: "ABC1234" },
        update: {},
        create: {
            shortCode: "ABC1234",
            vehicleId: vehicle.id,
            nfcPayload: "https://reachmasked.com/t/ABC1234",
            status: "ACTIVE",
        },
    });

    console.log("Created tag:", tag.shortCode);
    console.log("\n✅ Seed complete! Visit /t/ABC1234 to test.");

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    process.exit(1);
});
