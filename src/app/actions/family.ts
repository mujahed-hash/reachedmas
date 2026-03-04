"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addFamilyMember(email: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        const memberUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true }
        });

        if (!memberUser) {
            return { success: false, message: "User not found with this email" };
        }

        if (memberUser.id === session.user.id) {
            return { success: false, message: "You cannot add yourself as a family member" };
        }

        await prisma.familyMember.create({
            data: {
                ownerId: session.user.id,
                memberId: memberUser.id,
                role: "MEMBER"
            }
        });

        revalidatePath("/dashboard/family");
        return { success: true, message: `Added ${memberUser.name || email} to your family` };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: "User is already in your family" };
        }
        console.error("Error adding family member:", error);
        return { success: false, message: "Failed to add family member" };
    }
}

export async function removeFamilyMember(memberId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        await prisma.familyMember.delete({
            where: {
                ownerId_memberId: {
                    ownerId: session.user.id,
                    memberId: memberId
                }
            }
        });

        revalidatePath("/dashboard/family");
        return { success: true, message: "Member removed from family" };
    } catch (error) {
        console.error("Error removing family member:", error);
        return { success: false, message: "Failed to remove family member" };
    }
}

export async function getFamilyMembers() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await prisma.familyMember.findMany({
            where: { ownerId: session.user.id },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching family members:", error);
        return [];
    }
}

export async function getFamilyOwnerships() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await prisma.familyMember.findMany({
            where: { memberId: session.user.id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching family ownerships:", error);
        return [];
    }
}
