import jwt from "jsonwebtoken";
export function getAuthUser(req) {
    return req.user;
}
export function tokenCheck(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({
            error: true,
            data: null,
            message: 'auth failed'
        });
    }
    else {
        try {
            if (!auth.startsWith("Bearer ")) {
                return res.status(401).json({
                    error: true,
                    data: null,
                    message: 'bearer token is required'
                });
            }
            const token = auth.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    error: true,
                    data: null,
                    message: 'auth failed'
                });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (error) {
            return res.status(401).json({
                error: true,
                data: null,
                message: 'invalid token'
            });
        }
    }
}
export function adminOnly(req, res, next) {
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
// Frontend/Postman sends Authorization header
// -> tokenCheck reads token
// -> jwt.verify converts token into user data
// -> tokenCheck saves it as req.user
// -> getAuthUser(req) returns req.user as AuthUser
// middle ware is a function which is in btw req and res 
//# sourceMappingURL=auth.middleware.js.map