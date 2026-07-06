import type { Request, Response } from "express";
import { login, create, createByAdmin, getAll, getById, updatePassword, deleteId, sendPasswordResetLink, updatePasswordWithResetToken } from "./user.service.js";

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "Email and password are required",
      });
    }

    const result = await login({ email, password });

    if (!result) {
      return res.status(401).json({
        error: true,
        data: null,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      error: false,
      data: result,
      message: "Login successful",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function createdUser(req: Request, res: Response) {
  try {
    const userdata = req.body;
    const { email, password } = userdata;

    if (!email) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "email is not found",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "password is not correct",
      });
    }

    const result = await create({
      ...userdata,
      email: email.trim().toLowerCase(),
    });

    return res.status(200).json({
      error: false,
      data: result,
      message: "user created successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function createUserByAdmin(req: Request, res: Response) {
  try {
    const userdata = req.body;
    const { email, password, role } = userdata;

    if (!email) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "email is not found",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "password is not correct",
      });
    }

    if (role && role !== "ADMIN" && role !== "USER") {
      return res.status(400).json({
        error: true,
        data: null,
        message: "role must be ADMIN or USER",
      });
    }

    const result = await createByAdmin(userdata);

    return res.status(201).json({
      error: false,
      data: result,
      message: "user created successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "Email is required",
      });
    }

    const result = await sendPasswordResetLink(email);

    return res.status(200).json({
      error: false,
      data: null,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const token = req.body.token || req.body.resetToken;
    const password = req.body.password || req.body.newPassword;

    if (!token || !password) {
      return res.status(400).json({
        error: true,
        data: null,
        message: "Token and password are required",
      });
    }

    const result = await updatePasswordWithResetToken(token, password);

    return res.status(200).json({
      error: false,
      data: null,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const result = await getAll();
    return res.status(200).json({
      error: false,
      data: result,
      message: "user found successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const result = await getById(id as string);
    return res.status(200).json({
      error: false,
      data: result,
      message: "id sent",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: error.message,
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const result = await updatePassword(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      data: null,
      message: "password didnt update",
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const result = await deleteId(id as string);
    return res.status(200).json({
      message: "user deleted successfully",
      user: result,
    });
  } catch (error: any) {
    return res.status(404).json({
      error: true,
      data: null,
      message: "user is not deleted",
    });
  }
}
