import { prisma } from "../../config/prisma.ts";
import type { AuthUser } from "../../middleware/auth.middleware.ts";

function normalizeFieldType(type: string) {
  const fieldType = type.toUpperCase();

  if (fieldType === "RADIO") {
    return "TEXT";
  }

  if (["TEXT", "DATE", "NUMBER", "CHECKBOX", "DROPDOWN"].includes(fieldType)) {
    return fieldType;
  }

  return "TEXT";
}

export async function createForm(data: any) {
  const { appId, name, createdBy, status, fields = [] } = data;

  return await prisma.form.create({
    data: {
      appId,
      name,
      createdBy,
      status: status ? status.toUpperCase() : undefined,
      fields: {
        create: fields.map((field: any, index: number) => ({
          controlKey: field.controlKey ?? field.fieldKey ?? field.id ?? `field_${index + 1}`,
          type: normalizeFieldType(field.type),
          label: field.label,
          placeholder: field.placeholder,
          required: field.required ?? false,
          dropdownItems: field.dropdownItems,
          sortOrder: field.sortOrder ?? index,
        })),
      },
    } as any,
    include: {
      fields: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function getAllForms(user?: AuthUser) {
  const where = user && user.role !== "ADMIN" ? { createdBy: user.id } : undefined;

  return await prisma.form.findMany({
    ...(where ? { where } : {}),
    include: {
      app: true,
      fields: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function getFormById(id: string, user?: AuthUser) {
  const where = user && user.role !== "ADMIN" ? { id, createdBy: user.id } : { id };

  return await prisma.form.findFirst({
    where,
    include: {
      app: true,
      fields: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      responses: {
        include: {
          values: true,
        },
      },
    },
  });
}

export async function getFormsByAppId(appId: string, user?: AuthUser) {
  const where = user && user.role !== "ADMIN" ? { appId, createdBy: user.id } : { appId };

  return await prisma.form.findMany({
    where,
    include: {
      fields: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}
