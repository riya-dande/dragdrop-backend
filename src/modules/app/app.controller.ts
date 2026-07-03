import type { Request, Response } from "express";
import { createApp, getAllApps, getAppById } from "./app.service.js";
import { getAuthUser } from "../../middleware/auth.middleware.js";

export async function createAppController(req: Request, res: Response) {
  try {
    const user = getAuthUser(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "app name is required",
      });
    }

    if (!user) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "logged in user is required",
      });
    }

    const result = await createApp({
      ...req.body,
      createdBy: user.id,
    });

    return res.status(201).json({
      error: false,
      data: result,
      message: "app created successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getAllAppsController(req: Request, res: Response) {
  try {
    const result = await getAllApps(getAuthUser(req));

    return res.status(200).json({
      error: false,
      data: result,
      message: "apps found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getAppByIdController(req: Request, res: Response) {
  try {
    const result = await getAppById(req.params.id as string, getAuthUser(req));

    if (!result) {
      return res.status(404).json({
        error: true,
        data: null,
        message: "app not found",
      });
    }

    return res.status(200).json({
      error: false,
      data: result,
      message: "app found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}
