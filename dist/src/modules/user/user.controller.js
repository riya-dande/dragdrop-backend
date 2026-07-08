import { login, create, createByAdmin, getAll, getById, updatePassword, deleteId, sendPasswordResetLink, updatePasswordWithResetToken } from "./user.service.js";
const gmailOnlyMessage = "Please enter a Gmail account only.";
const strongPasswordMessage = "Password must be at least 8 characters and include a letter, a number, and a special character.";
function isGmailAddress(email) {
    return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}
function isStrongPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password.trim());
}
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                data: null,
                message: "Email and password are required",
            });
        }
        if (!isGmailAddress(email)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: gmailOnlyMessage,
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
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function createdUser(req, res) {
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
        if (!isGmailAddress(email)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: gmailOnlyMessage,
            });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: strongPasswordMessage,
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
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function createUserByAdmin(req, res) {
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
        if (!isGmailAddress(email)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: gmailOnlyMessage,
            });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: strongPasswordMessage,
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
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                error: true,
                data: null,
                message: "Email is required",
            });
        }
        if (!isGmailAddress(email)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: gmailOnlyMessage,
            });
        }
        const result = await sendPasswordResetLink(email);
        return res.status(200).json({
            error: false,
            data: {
                resetLink: result.resetLink,
            },
            message: result.message,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function resetPassword(req, res) {
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
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: strongPasswordMessage,
            });
        }
        const result = await updatePasswordWithResetToken(token, password);
        return res.status(200).json({
            error: false,
            data: null,
            message: result.message,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function getAllUsers(req, res) {
    try {
        const result = await getAll();
        return res.status(200).json({
            error: false,
            data: result,
            message: "user found successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function getUserById(req, res) {
    try {
        const id = req.params.id;
        const result = await getById(id);
        return res.status(200).json({
            error: false,
            data: result,
            message: "id sent",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: error.message,
        });
    }
}
export async function changePassword(req, res) {
    try {
        const password = req.body.newPassword || req.body.password;
        if (!password || !isStrongPassword(password)) {
            return res.status(400).json({
                error: true,
                data: null,
                message: strongPasswordMessage,
            });
        }
        const result = await updatePassword(req.body);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            data: null,
            message: "password didnt update",
        });
    }
}
export async function deleteUser(req, res) {
    try {
        const id = req.params.id;
        const result = await deleteId(id);
        return res.status(200).json({
            message: "user deleted successfully",
            user: result,
        });
    }
    catch (error) {
        return res.status(404).json({
            error: true,
            data: null,
            message: "user is not deleted",
        });
    }
}
//# sourceMappingURL=user.controller.js.map