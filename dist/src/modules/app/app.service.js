import { prisma } from "../../config/prisma.js";
export async function createApp(data) {
    const { name, type, createdBy } = data;
    return await prisma.app.create({
        data: {
            name,
            type: type ?? "Collab",
            createdBy,
        },
    });
}
export async function getAllApps(user) {
    const where = user && user.role !== "ADMIN" ? { createdBy: user.id } : undefined;
    return await prisma.app.findMany({
        ...(where ? { where } : {}),
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    role: true,
                },
            },
            forms: true,
        },
    });
}
export async function getAppById(id, user) {
    const where = user && user.role !== "ADMIN" ? { id, createdBy: user.id } : { id };
    return await prisma.app.findFirst({
        where,
        include: {
            creator: {
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                    role: true,
                },
            },
            forms: {
                include: {
                    fields: {
                        orderBy: {
                            sortOrder: "asc",
                        },
                    },
                },
            },
        },
    });
}
//# sourceMappingURL=app.service.js.map