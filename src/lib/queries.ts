/**
 * @file queries.ts
 * @module web-builder
 * @description Server actions for user, agency, and invitation queries
 * @author BharatERP
 * @created 2025-02-23
 */

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { redirect } from "next/navigation";
import type { User, Role } from "@prisma/client";

export const getAuthUserDetails = async () => {
    const user = await currentUser();
    if (!user) {
        return;
    }

    const userData = await db.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        include: {
            Agency: {
                include: {
                    SidebarOption: true,
                    SubAccount: {
                        include: {
                            SidebarOption: true,
                        },
                    },
                },
            },
            Permissions: true,
        },
    });
    return userData;
};

export interface SaveActivityLogsParams {
    agencyId: string;
    description: string;
    subAccountId?: string;
}

export const saveActivityLogsNotifications = async (
    params: SaveActivityLogsParams
) => {
    const { agencyId, description, subAccountId } = params;
    const authUser = await currentUser();

    let userData;

    if (!authUser) {
        if (subAccountId) {
            const response = await db.user.findFirst({
                where: {
                    Agency: {
                        SubAccount: {
                            some: { id: subAccountId },
                        },
                    },
                },
            });
            if (response) {
                userData = response;
            }
        }
    } else {
        userData = await db.user.findUnique({
            where: {
                email: authUser.emailAddresses[0].emailAddress,
            },
        });
    }

    return userData;
};

export interface CreateTeamUserInput {
    email: string;
    agencyId: string;
    avatarUrl: string;
    id: string;
    name: string;
    role: Role;
}

export const createTeamUser = async (
    agencyId: string,
    userInput: CreateTeamUserInput
) => {
    if (userInput.role === "AGENCY_OWNER") return null;
    const response = await db.user.create({
        data: {
            ...userInput,
            agencyId,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    return response;
};

export const verifyAndAcceptInvitation = async () => {
    const user = await currentUser();

    if (!user) return redirect("/agency/sign-in");

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return redirect("/agency/sign-in");

    const invitationExists = await db.invitation.findUnique({
        where: {
            email,
            status: "PENDING",
        },
    });

    if (invitationExists) {
        await createTeamUser(invitationExists.agencyId, {
            email: invitationExists.email,
            agencyId: invitationExists.agencyId,
            avatarUrl: user.imageUrl ?? "",
            id: user.id,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
            role: invitationExists.role,
        });
    }

    return null;
};
