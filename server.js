import express from "express";
import http from "node:http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { PUBLIC_DIR, VIEWS_DIR } from "../utils/path.js";
import { sequelize } from "./models/index.js";
import socketService from "./services/socket.service.js";
import viewRoutes from "./routes/view.routes.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(PUBLIC_DIR));

// View Engine
app.set("view engine", "ejs");
app.set("views", VIEWS_DIR);

// --- Routes ---
app.use("/", viewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes); // Chứa đầy đủ các API Chat

// --- Database & Socket ---
socketService.init(server);

const PORT = process.env.PORT || 3000;

sequelize
    .sync({ alter: true })
    .then(() => {
        console.log("Database connected & synced");
        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to database:", err);
    });
