"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { generateShortCode } from "@/lib/utils";

type AssetType = "CAR" | "PET" | "HOME" | "PERSON" | "ASSET";

interface AddAssetResult {
    success: boolean;
    message: string;
    assetId?: string;
}

export async function addAsset(formData: FormData): Promise<AddAssetResult> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated" };
    }

    const type = (formData.get("type") as AssetType) || "CAR";
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;

    if (!name) {
        return { success: false, message: "Name is required" };
    }

    // Enforce per-plan limits
    const existingCount = await prisma.asset.count({
        where: { ownerId: session.user.id },
    });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, plan: true } });

    if (!user) {
        console.error(`[addAsset] User not found in database for ID: ${session.user.id}`);
        return { success: false, message: "User session invalid. Please log out and log in again." };
    }

    console.log(`[addAsset] User found: ${user.id}, plan: ${user.plan}`);

    const limit = user.plan === "PREMIUM" ? 1 : 0;

    if (user.plan === "FREE") {
        return {
            success: false,
            message: "A paid plan is required to add your first tag. Upgrade to continue.",
        };
    }

    if (existingCount >= limit) {
        return {
            success: false,
            message: `Your current plan supports up to ${limit} asset(s). Contact support to add more.`,
        };
    }

    // Build type-specific metadata
    let metadata: Record<string, any> = {};
    if (type === "CAR") {
        metadata = {
            model: formData.get("model") || "",
            color: formData.get("color") || "",
            year: formData.get("year") || null,
            licensePlate: formData.get("licensePlate") || null,
        };
    } else if (type === "PET") {
        metadata = {
            species: formData.get("species") || "",
            breed: formData.get("breed") || "",
            color: formData.get("color") || "",
            microchipId: formData.get("microchipId") || null,
            weight: formData.get("weight") || null,
        };
    } else if (type === "HOME") {
        metadata = {
            address: formData.get("address") || "",
            unit: formData.get("unit") || null,
            city: formData.get("city") || "",
            state: formData.get("state") || "",
            zip: formData.get("zip") || "",
        };
    } else if (type === "PERSON") {
        metadata = {
            relationship: formData.get("relationship") || "",
            age: formData.get("age") || null,
        };
    } else {
        metadata = {
            category: formData.get("category") || "",
            serialNumber: formData.get("serialNumber") || null,
            value: formData.get("value") || null,
            description: formData.get("description") || "",
        };
    }

    try {
        console.log(`[addAsset] Starting creation for user ${session.user.id}, name: ${name}, type: ${type}`);

        let shortCode = generateShortCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.tag.findUnique({ where: { shortCode } });
            if (!existing) break;
            shortCode = generateShortCode();
            attempts++;
        }

        console.log(`[addAsset] Generated shortCode: ${shortCode}`);

        const asset = await prisma.asset.create({
            data: {
                ownerId: session.user.id,
                type,
                name,
                subtitle: subtitle || null,
                metadata: JSON.stringify(metadata),
                tags: {
                    create: {
                        shortCode,
                        status: "ACTIVE",
                    },
                },
            },
            include: { tags: true },
        });

        console.log(`[addAsset] Successfully created asset: ${asset.id}`);
        revalidatePath("/dashboard");

        return {
            success: true,
            message: `${type === "CAR" ? "Vehicle" : type.charAt(0) + type.slice(1).toLowerCase()} added with tag code: ${shortCode}`,
            assetId: asset.id,
        };
    } catch (error) {
        console.error("[addAsset] Critical error adding asset:", error);
        return { success: false, message: "Failed to add asset" };
    }
}

export async function deleteAsset(assetId: string): Promise<{ success: boolean; message: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated" };
    }

    try {
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, ownerId: session.user.id },
        });

        if (!asset) {
            return { success: false, message: "Asset not found" };
        }

        await prisma.asset.delete({ where: { id: assetId } });

        revalidatePath("/dashboard");
        return { success: true, message: "Asset deleted" };
    } catch (error) {
        console.error("Error deleting asset:", error);
        return { success: false, message: "Failed to delete asset" };
    }
}
