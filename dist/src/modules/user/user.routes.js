import Router from "express";
import { loginUser, createdUser, createUserByAdmin, getAllUsers, getUserById, changePassword, deleteUser, forgotPassword, resetPassword } from "./user.controller.js";
import { adminOnly, tokenCheck } from "../../middleware/auth.middleware.js";
export const userRouter = Router();
userRouter.post("/login", loginUser);
userRouter.post("/create", createdUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/forget-password", forgotPassword);
userRouter.post("/forgotPassword", forgotPassword);
userRouter.post("/forgetPassword", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/resetPassword", resetPassword);
userRouter.post("/create-by-admin", tokenCheck, adminOnly, createUserByAdmin);
userRouter.get("/getAll", tokenCheck, adminOnly, getAllUsers);
userRouter.get("/get/:id", tokenCheck, adminOnly, getUserById);
userRouter.put("/updatepass", changePassword);
userRouter.delete("/delete/:id", tokenCheck, adminOnly, deleteUser);
//# sourceMappingURL=user.routes.js.map