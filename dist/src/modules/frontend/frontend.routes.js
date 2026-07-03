import Router from "express";
import { prisma } from "../../config/prisma.js";
import { getAuthUser, tokenCheck } from "../../middleware/auth.middleware.js";
const DEFAULT_USER_EMAIL = "dragdrop-system@example.com";
const DEFAULT_APP_NAME = "DragDrop";
export const frontendRouter = Router();
function normalizeFieldType(type) {
    const fieldType = (type || "text").toUpperCase();
    if (fieldType === "RADIO") {
        return "TEXT";
    }
    if (["TEXT", "DATE", "NUMBER", "CHECKBOX", "DROPDOWN"].includes(fieldType)) {
        return fieldType;
    }
    return "TEXT";
}
function paramValue(value) {
    return Array.isArray(value) ? value[0] : value;
}
function mapField(field) {
    return {
        id: field.id,
        type: String(field.type).toLowerCase(),
        label: field.label,
        placeholder: field.placeholder ?? "",
        required: field.required,
        dropdownItems: Array.isArray(field.dropdownItems) ? field.dropdownItems : undefined,
    };
}
function mapForm(form) {
    return {
        id: form.id,
        appId: form.appId,
        name: form.name,
        fields: (form.fields ?? []).map(mapField),
        createdAt: form.createdAt instanceof Date ? form.createdAt.toISOString() : form.createdAt,
    };
}
function mapResponse(response) {
    const values = Object.fromEntries((response.values ?? []).map((item) => [item.field?.id ?? item.dataControlId, item.value]));
    return {
        id: response.id,
        formId: response.formId,
        submittedAt: response.submittedAt,
        values,
    };
}
async function getDefaultUser() {
    return prisma.user.upsert({
        where: {
            email: DEFAULT_USER_EMAIL,
        },
        update: {},
        create: {
            email: DEFAULT_USER_EMAIL,
            password: "dragdrop-system-user",
        },
    });
}
async function getDefaultApp() {
    const user = await getDefaultUser();
    const existingApp = await prisma.app.findFirst({
        where: {
            name: DEFAULT_APP_NAME,
            createdBy: user.id,
        },
    });
    if (existingApp) {
        return existingApp;
    }
    return prisma.app.create({
        data: {
            name: DEFAULT_APP_NAME,
            type: "Collab",
            createdBy: user.id,
        },
    });
}
async function getFormWithFields(id) {
    return prisma.form.findUnique({
        where: {
            id,
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
function buildFieldCreates(fields) {
    return fields.map((field, index) => ({
        controlKey: String(field.id ?? `field_${index + 1}`),
        type: normalizeFieldType(field.type),
        label: field.label?.trim() || `Field ${index + 1}`,
        placeholder: field.placeholder ?? "",
        required: field.required ?? false,
        dropdownItems: field.dropdownItems,
        sortOrder: index,
    }));
}
async function buildRecordPayload(formId, values) {
    const form = await getFormWithFields(formId);
    if (!form) {
        throw new Error("FORM_NOT_FOUND");
    }
    const recordValues = Object.entries(values).flatMap(([key, value]) => {
        const field = form.fields.find(item => item.id === key || item.controlKey === key);
        if (!field) {
            return [];
        }
        return {
            dataControlId: field.id,
            value: value,
        };
    });
    return {
        appId: form.appId,
        values: recordValues,
    };
}
frontendRouter.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});
frontendRouter.use(tokenCheck);
frontendRouter.get("/apps", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const where = user && user.role !== "ADMIN" ? { createdBy: user.id } : undefined;
        const apps = await prisma.app.findMany({
            ...(where ? { where } : {}),
            orderBy: {
                createdAt: "desc",
            },
            include: {
                forms: true,
            },
        });
        return res.status(200).json(apps);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.post("/apps", async (req, res) => {
    try {
        const { name, type = "Collab" } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: "App name is required." });
        }
        const user = getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Login required." });
        }
        const existingApp = await prisma.app.findFirst({
            where: {
                name: name.trim(),
            },
        });
        if (existingApp) {
            return res.status(409).json({ message: "An app with this name already exists." });
        }
        const app = await prisma.app.create({
            data: {
                name: name.trim(),
                type,
                createdBy: user.id,
            },
        });
        return res.status(201).json(app);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.put("/apps/:id", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const appId = paramValue(req.params.id);
        const { name, type } = req.body;
        if (!appId) {
            return res.status(400).json({ message: "App id is required." });
        }
        if (!name?.trim()) {
            return res.status(400).json({ message: "App name is required." });
        }
        const existingApp = await prisma.app.findUnique({
            where: {
                id: appId,
            },
        });
        if (!existingApp) {
            return res.status(404).json({ message: "App not found." });
        }
        if (user?.role !== "ADMIN" && existingApp.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot update this app." });
        }
        const duplicateApp = await prisma.app.findFirst({
            where: {
                name: name.trim(),
                id: {
                    not: appId,
                },
            },
        });
        if (duplicateApp) {
            return res.status(409).json({ message: "An app with this name already exists." });
        }
        const app = await prisma.app.update({
            where: {
                id: appId,
            },
            data: {
                name: name.trim(),
                type,
            },
        });
        return res.status(200).json(app);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.delete("/apps/:id", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const appId = paramValue(req.params.id);
        if (!appId) {
            return res.status(400).json({ message: "App id is required." });
        }
        const app = await prisma.app.findUnique({
            where: {
                id: appId,
            },
        });
        if (!app) {
            return res.status(404).json({ message: "App not found." });
        }
        if (user?.role !== "ADMIN" && app.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot delete this app." });
        }
        const forms = await prisma.form.findMany({
            where: {
                appId,
            },
            include: {
                fields: true,
                responses: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        const fieldIds = forms.flatMap(form => form.fields.map(field => field.id));
        const responseIds = forms.flatMap(form => form.responses.map(response => response.id));
        await prisma.recordValue.deleteMany({
            where: {
                OR: [
                    {
                        dataControlId: {
                            in: fieldIds,
                        },
                    },
                    {
                        recordId: {
                            in: responseIds,
                        },
                    },
                ],
            },
        });
        await prisma.record.deleteMany({
            where: {
                formId: {
                    in: forms.map(form => form.id),
                },
            },
        });
        await prisma.dataControl.deleteMany({
            where: {
                formId: {
                    in: forms.map(form => form.id),
                },
            },
        });
        await prisma.form.deleteMany({
            where: {
                appId,
            },
        });
        await prisma.app.delete({
            where: {
                id: appId,
            },
        });
        return res.sendStatus(204);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.post("/forms", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const { appId, name, fields = [] } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: "Form name is required." });
        }
        if (!appId) {
            return res.status(400).json({ message: "App id is required." });
        }
        if (!Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ message: "At least one field is required." });
        }
        const app = await prisma.app.findUnique({
            where: {
                id: appId,
            },
        });
        if (!app) {
            return res.status(404).json({ message: "App not found." });
        }
        if (user?.role !== "ADMIN" && app.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot create a form for this app." });
        }
        const form = await prisma.form.create({
            data: {
                appId: app.id,
                name: name.trim(),
                createdBy: user?.id,
                fields: {
                    create: buildFieldCreates(fields),
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
        return res.status(201).json(mapForm(form));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.get("/forms/current", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const where = user && user.role !== "ADMIN" ? { createdBy: user.id } : undefined;
        const form = await prisma.form.findFirst({
            ...(where ? { where } : {}),
            orderBy: {
                createdAt: "desc",
            },
            include: {
                fields: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                },
            },
        });
        if (!form) {
            return res.status(404).json({ message: "No form found." });
        }
        return res.status(200).json(mapForm(form));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.get("/forms", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const where = user && user.role !== "ADMIN" ? { createdBy: user.id } : undefined;
        const forms = await prisma.form.findMany({
            ...(where ? { where } : {}),
            orderBy: {
                createdAt: "desc",
            },
            include: {
                fields: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                },
            },
        });
        return res.status(200).json(forms.map(mapForm));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.get("/forms/:id", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const formId = paramValue(req.params.id);
        if (!formId) {
            return res.status(400).json({ message: "Form id is required." });
        }
        const form = await getFormWithFields(formId);
        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }
        if (user?.role !== "ADMIN" && form.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot access this form." });
        }
        return res.status(200).json(mapForm(form));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.put("/forms/:id", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const { name, fields = [] } = req.body;
        const formId = paramValue(req.params.id);
        if (!formId) {
            return res.status(400).json({ message: "Form id is required." });
        }
        const existingForm = await getFormWithFields(formId);
        if (!existingForm) {
            return res.status(404).json({ message: "Form not found." });
        }
        if (user?.role !== "ADMIN" && existingForm.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot update this form." });
        }
        if (!name?.trim()) {
            return res.status(400).json({ message: "Form name is required." });
        }
        if (!Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ message: "At least one field is required." });
        }
        await prisma.recordValue.deleteMany({
            where: {
                dataControlId: {
                    in: existingForm.fields.map(field => field.id),
                },
            },
        });
        await prisma.dataControl.deleteMany({
            where: {
                formId: existingForm.id,
            },
        });
        const updatedForm = await prisma.form.update({
            where: {
                id: existingForm.id,
            },
            data: {
                name: name.trim(),
                fields: {
                    create: buildFieldCreates(fields),
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
        return res.status(200).json(mapForm(updatedForm));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.delete("/forms/:id", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const formId = paramValue(req.params.id);
        if (!formId) {
            return res.status(400).json({ message: "Form id is required." });
        }
        const form = await getFormWithFields(formId);
        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }
        if (user?.role !== "ADMIN" && form.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot delete this form." });
        }
        const responses = await prisma.record.findMany({
            where: {
                formId: form.id,
            },
            select: {
                id: true,
            },
        });
        await prisma.recordValue.deleteMany({
            where: {
                OR: [
                    {
                        dataControlId: {
                            in: form.fields.map(field => field.id),
                        },
                    },
                    {
                        recordId: {
                            in: responses.map(response => response.id),
                        },
                    },
                ],
            },
        });
        await prisma.record.deleteMany({
            where: {
                formId: form.id,
            },
        });
        await prisma.dataControl.deleteMany({
            where: {
                formId: form.id,
            },
        });
        await prisma.form.delete({
            where: {
                id: form.id,
            },
        });
        return res.sendStatus(204);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.post("/forms/:formId/responses", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const formId = paramValue(req.params.formId);
        if (!formId) {
            return res.status(400).json({ message: "Form id is required." });
        }
        const recordPayload = await buildRecordPayload(formId, req.body.values ?? {});
        if (recordPayload.values.length === 0) {
            return res.status(400).json({ message: "At least one valid response value is required." });
        }
        const response = await prisma.record.create({
            data: {
                appId: recordPayload.appId,
                formId,
                submittedBy: user?.id ?? null,
                values: {
                    create: recordPayload.values,
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
        return res.status(201).json(mapResponse(response));
    }
    catch (error) {
        if (error.message === "FORM_NOT_FOUND") {
            return res.status(404).json({ message: "Form not found." });
        }
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.get("/forms/:formId/responses", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const formId = paramValue(req.params.formId);
        if (!formId) {
            return res.status(400).json({ message: "Form id is required." });
        }
        const form = await prisma.form.findUnique({
            where: {
                id: formId,
            },
        });
        if (!form) {
            return res.status(404).json({ message: "Form not found." });
        }
        const where = user && user.role !== "ADMIN" && form.createdBy !== user.id
            ? { formId, submittedBy: user.id }
            : { formId };
        const responses = await prisma.record.findMany({
            ...(where ? { where } : {}),
            orderBy: {
                submittedAt: "desc",
            },
            include: {
                values: {
                    include: {
                        field: true,
                    },
                },
            },
        });
        return res.status(200).json(responses.map(mapResponse));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.get("/responses", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const where = user && user.role !== "ADMIN"
            ? {
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
            : undefined;
        const responses = await prisma.record.findMany({
            ...(where ? { where } : {}),
            orderBy: {
                submittedAt: "desc",
            },
            include: {
                values: {
                    include: {
                        field: true,
                    },
                },
            },
        });
        return res.status(200).json(responses.map(mapResponse));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.put("/responses/:recordId", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const recordId = paramValue(req.params.recordId);
        if (!recordId) {
            return res.status(400).json({ message: "Response id is required." });
        }
        const response = await prisma.record.findUnique({
            where: {
                id: recordId,
            },
            include: {
                form: true,
            },
        });
        if (!response) {
            return res.status(404).json({ message: "Response not found." });
        }
        if (user?.role !== "ADMIN" &&
            response.submittedBy !== user?.id &&
            response.form.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot update this response." });
        }
        const recordPayload = await buildRecordPayload(response.formId, req.body.values ?? {});
        await prisma.recordValue.deleteMany({
            where: {
                recordId: response.id,
            },
        });
        const updatedResponse = await prisma.record.update({
            where: {
                id: response.id,
            },
            data: {
                values: {
                    create: recordPayload.values,
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
        return res.status(200).json(mapResponse(updatedResponse));
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
frontendRouter.delete("/responses/:recordId", async (req, res) => {
    try {
        const user = getAuthUser(req);
        const recordId = paramValue(req.params.recordId);
        if (!recordId) {
            return res.status(400).json({ message: "Response id is required." });
        }
        const response = await prisma.record.findUnique({
            where: {
                id: recordId,
            },
            include: {
                form: true,
            },
        });
        if (!response) {
            return res.status(404).json({ message: "Response not found." });
        }
        if (user?.role !== "ADMIN" &&
            response.submittedBy !== user?.id &&
            response.form.createdBy !== user?.id) {
            return res.status(403).json({ message: "You cannot delete this response." });
        }
        await prisma.recordValue.deleteMany({
            where: {
                recordId: response.id,
            },
        });
        await prisma.record.delete({
            where: {
                id: response.id,
            },
        });
        return res.sendStatus(204);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
//# sourceMappingURL=frontend.routes.js.map