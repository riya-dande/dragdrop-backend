import Router from "express";
import {
  createResponseController,
  getResponseByIdController,
  getResponsesByFormController,
} from "./response.controller.ts";
import { tokenCheck } from "../../middleware/auth.middleware.ts";

export const responseRouter = Router();

responseRouter.post("/create", tokenCheck, createResponseController);
responseRouter.get("/get/:id", tokenCheck, getResponseByIdController);
responseRouter.get("/form/:formId", tokenCheck, getResponsesByFormController);
