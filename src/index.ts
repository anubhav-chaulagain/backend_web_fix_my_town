import express, { Application } from 'express';
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";

import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.route";

const app: Application = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

async function startServer() {
    await connectDatabase();

    app.listen(
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

startServer();