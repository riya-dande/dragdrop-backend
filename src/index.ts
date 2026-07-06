import express from "express"
import {userRouter} from "./modules/user/user.routes.js"
import { appRouter } from "./modules/app/app.routes.js"
import { formRouter } from "./modules/forms/form.routes.js"
import { responseRouter } from "./modules/response/response.routes.js"
import { frontendRouter } from "./modules/frontend/frontend.routes.js"
import cors from "cors";
const app = express()
const primaryPort = Number(process.env.PORT ?? 3000)
const ports = Array.from(new Set([primaryPort, 8081]))
app.use(cors({
    origin:[
        "http://localhost:4200",
        "https://drapdrop.netlify.app",
        "https://6a475ca239fed69b64fcb0f8--drapdrop.netlify.app"
    ],
    credentials:true

}));

app.use(express.json());

app.use("/api/v1/user",userRouter);
app.use("/api/v1/app", appRouter);
app.use("/api/v1/form", formRouter);
app.use("/api/v1/response", responseRouter);
app.use("/api", frontendRouter);

app.get("/api/health", (request, response) => {
    response.status(200).json({
        error: false,
        data: null,
        message: "Server is working fine."
    })
});


for (const port of ports) {
    app.listen(port, (error?: Error) => {
        if (error) {
            console.error("Failed to start server:", error.message)
            process.exit(1)
        }

        console.log(`Server started at http://localhost:${port}`)
    });
}
