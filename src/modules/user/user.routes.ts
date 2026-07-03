import Router from "express"
import {loginUser,createdUser,createUserByAdmin,getAllUsers,getUserById, changePassword, deleteUser} from "./user.controller.ts";
import { adminOnly, tokenCheck } from "../../middleware/auth.middleware.ts";

export const userRouter = Router();
userRouter.post("/login",loginUser);
userRouter.post("/create",createdUser);
userRouter.post("/create-by-admin",tokenCheck,adminOnly,createUserByAdmin);
userRouter.get("/getAll",tokenCheck,adminOnly,getAllUsers);
userRouter.get("/get/:id",tokenCheck,adminOnly,getUserById);
userRouter.put("/updatepass",changePassword)
userRouter.delete("/delete/:id",tokenCheck,adminOnly,deleteUser)
