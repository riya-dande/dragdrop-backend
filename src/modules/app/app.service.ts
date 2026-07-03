import { prisma } from "../../config/prisma.js";
import type { AuthUser } from "../../middleware/auth.middleware.js";

export async function createApp(data: any) {
  const { name, type, createdBy } = data;

  return await prisma.app.create({
    data: {
      name,
      type: type ?? "Collab",
      createdBy,
    },
  });
}

export async function getAllApps(user?: AuthUser) {
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

export async function getAppById(id: string, user?: AuthUser) {
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
