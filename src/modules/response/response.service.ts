import { prisma } from "../../config/prisma.js";
import type { AuthUser } from "../../middleware/auth.middleware.js";

export async function createFormResponse(data: any) {
  const { formId, submittedBy, values = [] } = data;
  const form = await prisma.form.findUnique({
    where: {
      id: formId,
    },
    select: {
      appId: true,
    },
  });

  if (!form) {
    throw new Error("form not found");
  }

  return await prisma.record.create({
    data: {
      appId: form.appId,
      formId,
      submittedBy,
      values: {
        create: values.map((item: any) => ({
          dataControlId: item.dataControlId ?? item.fieldId,
          value: item.value,
        })),
      },
    },
    include: {
      values: {
        include: {
          field: true,
        },
      },
    },
  });
}

export async function getResponsesByFormId(formId: string, user?: AuthUser) {
  const where = user && user.role !== "ADMIN"
    ? {
        formId,
        OR: [
          {
            submittedBy: user.id,
          },
          {
            form: {
              createdBy: user.id,
            },
          },
        ],
      }
    : { formId };

  return await prisma.record.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          role: true,
        },
      },
      values: {
        include: {
          field: true,
        },
      },
    },
  });
}

export async function getResponseById(id: string, user?: AuthUser) {
  const where = user && user.role !== "ADMIN"
    ? {
        id,
        OR: [
          {
            submittedBy: user.id,
          },
          {
            form: {
              createdBy: user.id,
            },
          },
        ],
      }
    : { id };

  return await prisma.record.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          role: true,
        },
      },
      form: true,
      values: {
        include: {
          field: true,
        },
      },
    },
  });
}
