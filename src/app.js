import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import sessionMiddleware from "./config/session.js";

const app = express()
app.use(cors());
app.use(express.json());

app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.get('/api/health',(req,res)=>{
   res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
})

export default app