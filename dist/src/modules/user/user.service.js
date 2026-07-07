import { prisma } from "../../config/prisma.js";
import { protect } from "../../config/utils.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
export async function login(userdata) {
    const { email, password } = userdata;
    const user = await prisma.user.findUnique({
        where: {
            email: email.trim().toLowerCase(),
        },
    });
    if (!user) {
        return false;
    }
    if (!user.isActive) {
        return false;
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return false;
    }
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
    }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
    return {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
        token,
    };
}
export async function create(userdata) {
    const { email, password } = userdata;
    const usersCount = await prisma.user.count();
    const hashpass = await protect(password);
    const result = await prisma.user.create({
        data: {
            email: email.trim().toLowerCase(),
            password: hashpass,
            role: usersCount === 0 ? "ADMIN" : "USER",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
    return result;
}
export async function createByAdmin(userdata) {
    const { email, password, role } = userdata;
    const normalizedEmail = email.trim().toLowerCase();
    const hashpass = await protect(password);
    const existingUser = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });
    if (existingUser) {
        const result = await prisma.user.update({
            where: {
                email: normalizedEmail
            },
            data: {
                password: hashpass,
                role: role === "ADMIN" ? "ADMIN" : "USER",
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            }
        });
        return result;
    }
    const result = await prisma.user.create({
        data: {
            email: normalizedEmail,
            password: hashpass,
            role: role === "ADMIN" ? "ADMIN" : "USER",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
    return result;
}
export async function sendPasswordResetLink(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
    });
    if (!user || !user.isActive) {
        return {
            message: "If the email exists, password reset instructions have been sent.",
            resetLink: null,
        };
    }
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        purpose: "password-reset",
    }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    const emailSent = await sendResetEmail(user.email, resetLink);
    if (!emailSent) {
        return {
            message: "Email service is not configured. Use the reset link below for local testing.",
            resetLink,
        };
    }
    return {
        message: "Password reset link sent. Please check your email.",
        resetLink: null,
    };
}
export async function updatePasswordWithResetToken(token, password) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password-reset") {
        throw new Error("Invalid reset token");
    }
    const hashedPassword = await protect(password);
    await prisma.user.update({
        where: {
            id: decoded.id,
            email: decoded.email,
        },
        data: {
            password: hashedPassword,
        },
    });
    return {
        message: "Password updated successfully. Please login.",
    };
}
async function sendResetEmail(to, resetLink) {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 10000);
    if (!user || !pass) {
        if (!isLocalPasswordResetMode()) {
            throw new Error("Email service is not configured. Set SMTP_USER and SMTP_PASS.");
        }
        console.log(`Password reset link for ${to}: ${resetLink}`);
        return false;
    }
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        connectionTimeout: timeoutMs,
        greetingTimeout: timeoutMs,
        socketTimeout: timeoutMs,
        auth: {
            user,
            pass,
        },
    });
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || user,
            to,
            subject: "Reset your password",
            html: `
                <p>You requested a password reset.</p>
                <p><a href="${resetLink}">Click here to set a new password</a></p>
                <p>This link expires in 15 minutes.</p>
            `,
            text: `Open this link to set a new password: ${resetLink}`,
        });
        console.log("Password reset email result:", {
            to,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response,
        });
        if (!info.accepted?.length || info.rejected?.length) {
            throw new Error(`SMTP did not accept the reset email. Accepted: ${info.accepted?.join(", ") || "none"}. Rejected: ${info.rejected?.join(", ") || "none"}.`);
        }
    }
    catch (error) {
        throw new Error(`Unable to send reset email. Check SMTP_USER, SMTP_PASS, MAIL_FROM and Gmail App Password settings. ${error.message}`);
    }
    return true;
}
function isLocalPasswordResetMode() {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const isLocalFrontend = frontendUrl.includes("localhost") || frontendUrl.includes("127.0.0.1");
    return isLocalFrontend && process.env.RENDER !== "true" && process.env.NODE_ENV !== "production";
}
export async function getAll() {
    const users = await prisma.user.findMany({
        where: {
            isActive: true,
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            _count: {
                select: {
                    records: true,
                },
            },
        },
        orderBy: {
            email: "asc",
        },
    });
    return users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        recordsCount: user._count.records,
    }));
}
export async function getById(id) {
    const result = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
    return result;
}
export async function updatePassword(userdata) {
    const { email, newPassword } = userdata;
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    const hashedPassword = await protect(newPassword);
    await prisma.user.update({
        where: {
            email: email,
        },
        data: {
            password: hashedPassword,
        }
    });
    return {
        message: "password changed successfully",
    };
}
export async function deleteId(id) {
    const result = await prisma.user.update({
        where: {
            id: id
        },
        data: {
            isActive: false
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
    return result;
}
//# sourceMappingURL=user.service.js.map