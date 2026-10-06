"use server";

import { prisma } from "@/lib/prisma";

export async function getRecentUserActivity() {
    const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { lastLogin: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            lastLogin: true,
            createdAt: true,
            crmStatus: true,
        }
    });

    return recentUsers;
}
