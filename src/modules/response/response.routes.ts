import Router from "express";
import {
  createResponseController,
  getResponseByIdController,
  getResponsesByFormController,
} from "./response.controller.js";
import { tokenCheck } from "../../middleware/auth.middleware.js";

export const responseRouter = Router();

responseRouter.post("/create", tokenCheck, createResponseController);
responseRouter.get("/get/:id", tokenCheck, getResponseByIdController);
responseRouter.get("/form/:formId", tokenCheck, getResponsesByFormController);
