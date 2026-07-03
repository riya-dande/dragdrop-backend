import Router from "express";
import {
  createFormController,
  getAllFormsController,
  getFormByIdController,
  getFormsByAppIdController,
} from "./form.controller.ts";
import { tokenCheck } from "../../middleware/auth.middleware.ts";

export const formRouter = Router();

formRouter.post("/create", tokenCheck, createFormController);
formRouter.get("/getAll", tokenCheck, getAllFormsController);
formRouter.get("/get/:id", tokenCheck, getFormByIdController);
formRouter.get("/app/:appId", tokenCheck, getFormsByAppIdController);
