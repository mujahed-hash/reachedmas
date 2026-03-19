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

    // Create a demo asset
    const asset = await prisma.asset.upsert({
        where: { publicId: "demo-asset-001" },
        update: {},
        create: {
            publicId: "demo-asset-001",
            ownerId: user.id,
            name: "Toyota Camry",
            type: "CAR",
            subtitle: "Model S",
            metadata: JSON.stringify({ color: "Silver", licensePlateHash: "hashed_license_plate" })
        },
    });

    console.log("Created asset:", asset.publicId);

    // Create a demo tag
    const tag = await prisma.tag.upsert({
        where: { shortCode: "ABC1234" },
        update: {},
        create: {
            shortCode: "ABC1234",
            assetId: asset.id,
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
