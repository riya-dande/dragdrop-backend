import { prisma } from "../../config/prisma.js";
import { protect } from "../../config/utils.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

type PasswordResetToken = {
  id: string;
  email: string;
  purpose: "password-reset";
};

export async function login(userdata: any) {
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

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    }
  );

  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    role: user.role,
    token,
  };
}

export async function create(userdata:any){
    const {email,password}=userdata;
    const hashpass = await protect(password)
    const result = await prisma.user.create({
        data:{
            email: email.trim().toLowerCase(),
            password:hashpass,
            role: "USER",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    })
    return result
}

export async function createByAdmin(userdata:any){
    const {email,password,role}=userdata;
    const normalizedEmail = email.trim().toLowerCase();
    const hashpass = await protect(password)

    const existingUser = await prisma.user.findUnique({
        where:{
            email: normalizedEmail
        }
    });

    if (existingUser) {
        const result = await prisma.user.update({
            where:{
                email: normalizedEmail
            },
            data:{
                password:hashpass,
                role: role === "ADMIN" ? "ADMIN" : "USER",
                isActive:true,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            }
        })
        return result
    }

    const result = await prisma.user.create({
        data:{
            email: normalizedEmail,
            password:hashpass,
            role: role === "ADMIN" ? "ADMIN" : "USER",
        },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    })
    return result
}

export async function sendPasswordResetLink(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
    });

    if (!user || !user.isActive) {
        return {
            message: "If the email exists, password reset instructions have been sent.",
        };
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            purpose: "password-reset",
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "15m",
        }
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

    await sendResetEmail(user.email, resetLink);

    return {
        message: "Password reset link sent. Please check your email.",
    };
}

export async function updatePasswordWithResetToken(token: string, password: string) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as PasswordResetToken;

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

async function sendResetEmail(to: string, resetLink: string) {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);

    if (!user || !pass) {
        throw new Error("Email service is not configured. Set SMTP_USER and SMTP_PASS.");
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });

    await transporter.sendMail({
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
}

export async function getAll(){
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

export async function getById(id:string){
  const result = await prisma.user.findUnique({
        where:{ 
            id:id
        },
        select:{
            id: true,
            email: true,
            role: true,
            isActive: true,
        }

    })
    return result
}


export async function updatePassword(userdata:any){
    const {email,newPassword}=userdata;
    const user = await prisma.user.findUnique({
        where:{
            email:email,
        },
    });
    if(!user){
        throw new Error("User not found");
    }
    const hashedPassword = await protect(newPassword);
    await prisma.user.update({
        where:{
            email:email,
        },
        data:{
            password:hashedPassword,
        }
    });
    return{
        message:"password changed successfully",
    };
}
export async function deleteId(id:string) {
    const result=await prisma.user.update({
        where:{
            id:id
        },
        data:{
            isActive:false
        },
        select:{
            id: true,
            email: true,
            role: true,
            isActive: true,
        }
    })
    return result
}
