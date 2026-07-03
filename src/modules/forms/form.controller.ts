import type { Request, Response } from "express";
import { getAuthUser } from "../../middleware/auth.middleware.js";
import {
  createForm,
  getAllForms,
  getFormById,
  getFormsByAppId,
} from "./form.service.js";

export async function createFormController(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    const { appId, name, fields } = req.body;

    if (!appId || !name || !user) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "appId, name and logged in user are required",
      });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "fields must be a non-empty array",
      });
    }

    const result = await createForm({
      ...req.body,
      createdBy: user.id,
    });

    return res.status(201).json({
      error: false,
      data: result,
      message: "form created successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getAllFormsController(req: Request, res: Response) {
  try {
    const result = await getAllForms(getAuthUser(req));

    return res.status(200).json({
      error: false,
      data: result,
      message: "forms found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getFormByIdController(req: Request, res: Response) {
  try {
    const result = await getFormById(req.params.id as string, getAuthUser(req));

    if (!result) {
      return res.status(404).json({
        error: true,
        data: null,
        message: "form not found",
      });
    }

    return res.status(200).json({
      error: false,
      data: result,
      message: "form found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getFormsByAppIdController(req: Request, res: Response) {
  try {
    const result = await getFormsByAppId(req.params.appId as string, getAuthUser(req));

    return res.status(200).json({
      error: false,
      data: result,
      message: "forms found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}
