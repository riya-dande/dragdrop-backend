import { prisma } from "../../config/prisma.ts";
import { protect } from "../../config/utils.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
