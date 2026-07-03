import type { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
    id: string;
    email: string;
    role: "ADMIN" | "USER";
};

export function getAuthUser(req: Request) {
    return (req as any).user as AuthUser | undefined;
}

export function tokenCheck(req:Request,res:Response,next:NextFunction){
    const auth=req.headers.authorization;
if(!auth){
    return res.status(401).json({
        error:true,
        data:null,
        message:'auth failed'
    })
}
else{
    try {
        if (!auth.startsWith("Bearer ")) {
            return res.status(401).json({
                error:true,
                data:null,
                message:'bearer token is required'
            })
        }

        const token = auth.split(" ")[1];

        if (!token ) {
            return res.status(401).json({
                error:true,
                data:null,
                message:'auth failed'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
        (req as any).user = decoded;
        next();
    } catch (error: any) {
        return res.status(401).json({
            error:true,
            data:null,
            message:'invalid token'
        })
    }
}

}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
    const user = getAuthUser(req);

    if (!user || user.role !== "ADMIN") {
        return res.status(403).json({
            error: true,
            data: null,
            message: "admin access required",
        });
    }

    next();
}







// middle ware is a function which is in btw req and res 
