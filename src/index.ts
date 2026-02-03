import express, { Application } from 'express';
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";

import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin/user.route";

const app: Application = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use('/api/admin/users', adminUserRoutes);

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