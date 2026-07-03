import Router from "express";
import {
  createAppController,
  getAllAppsController,
  getAppByIdController,
} from "./app.controller.ts";
import { tokenCheck } from "../../middleware/auth.middleware.ts";

export const appRouter = Router();

appRouter.post("/create", tokenCheck, createAppController);
appRouter.get("/getAll", tokenCheck, getAllAppsController);
appRouter.get("/get/:id", tokenCheck, getAppByIdController);
