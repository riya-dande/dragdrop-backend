import Router from "express";
import {
  createAppController,
  getAllAppsController,
  getAppByIdController,
} from "./app.controller.js";
import { tokenCheck } from "../../middleware/auth.middleware.js";

export const appRouter = Router();

appRouter.post("/create", tokenCheck, createAppController);
appRouter.get("/getAll", tokenCheck, getAllAppsController);
appRouter.get("/get/:id", tokenCheck, getAppByIdController);
