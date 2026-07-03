import type { Request, Response } from "express";
import { getAuthUser } from "../../middleware/auth.middleware.js";
import {
  createFormResponse,
  getResponseById,
  getResponsesByFormId,
} from "./response.service.js";

export async function createResponseController(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    const { formId, values } = req.body;

    if (!formId) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "formId is required",
      });
    }

    if (!Array.isArray(values) || values.length === 0) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "values must be a non-empty array",
      });
    }

    const result = await createFormResponse({
      ...req.body,
      submittedBy: user?.id,
    });

    return res.status(201).json({
      error: false,
      data: result,
      message: "response submitted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getResponsesByFormController(req: Request, res: Response) {
  try {
    const result = await getResponsesByFormId(req.params.formId as string, getAuthUser(req));

    return res.status(200).json({
      error: false,
      data: result,
      message: "responses found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getResponseByIdController(req: Request, res: Response) {
  try {
    const result = await getResponseById(req.params.id as string, getAuthUser(req));

    if (!result) {
      return res.status(404).json({
        error: true,
        data: null,
        message: "response not found",
      });
    }

    return res.status(200).json({
      error: false,
      data: result,
      message: "response found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}
