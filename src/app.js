import express from "express";

const app = express()


app.get('/api/health',(req,res)=>{
   res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
})

export default app