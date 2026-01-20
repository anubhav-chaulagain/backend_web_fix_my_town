import express, { Application } from 'express';
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";

import cors from 'cors';

import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.route";

const app: Application = express();

let corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:5050"],
    // which domain can access your backend server
    // add frontend domain in origin
}
// origin: "*", // allow all domain to access your bakcend server
app.use(cors(corsOptions)); // implement cors middleware

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