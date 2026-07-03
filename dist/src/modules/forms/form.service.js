import { prisma } from "../../config/prisma.js";
function normalizeFieldType(type) {
    const fieldType = type.toUpperCase();
    if (fieldType === "RADIO") {
        return "TEXT";
    }
    if (["TEXT", "DATE", "NUMBER", "CHECKBOX", "DROPDOWN"].includes(fieldType)) {
        return fieldType;
    }
    return "TEXT";
}
export async function createForm(data) {
    const { appId, name, createdBy, status, fields = [] } = data;
    return await prisma.form.create({
        data: {
            appId,
            name,
            createdBy,
            status: status ? status.toUpperCase() : undefined,
            fields: {
                create: fields.map((field, index) => ({
                    controlKey: field.controlKey ?? field.fieldKey ?? field.id ?? `field_${index + 1}`,
                    type: normalizeFieldType(field.type),
                    label: field.label,
                    placeholder: field.placeholder,
                    required: field.required ?? false,
                    dropdownItems: field.dropdownItems,
                    sortOrder: field.sortOrder ?? index,
                })),
            },
        },
        include: {
            fields: {
                orderBy: {
                    sortOrder: "asc",
                },
            },
        },
    });
}
export async function getAllForms(user) {
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
export async function getFormById(id, user) {
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
export async function getFormsByAppId(appId, user) {
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
//# sourceMappingURL=form.service.js.map