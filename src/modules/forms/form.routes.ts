import Router from "express";
import {
  createFormController,
  getAllFormsController,
  getFormByIdController,
  getFormsByAppIdController,
} from "./form.controller.js";
import { tokenCheck } from "../../middleware/auth.middleware.js";

export const formRouter = Router();

formRouter.post("/create", tokenCheck, createFormController);
formRouter.get("/getAll", tokenCheck, getAllFormsController);
formRouter.get("/get/:id", tokenCheck, getFormByIdController);
formRouter.get("/app/:appId", tokenCheck, getFormsByAppIdController);
