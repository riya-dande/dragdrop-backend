import { prisma } from "../../config/prisma.js";
export async function createFormResponse(data) {
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
                create: values.map((item) => ({
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
export async function getResponsesByFormId(formId, user) {
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
export async function getResponseById(id, user) {
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
//# sourceMappingURL=response.service.js.map