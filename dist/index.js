import express from "express";
const app = express();
const port = 8081;
app.get("/api/health", (request, response) => {
    response.status(200).json({
        error: false,
        data: null,
        message: "Server is working fine."
    });
});
app.listen(port, (error) => {
    if (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
    console.log(`Server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map