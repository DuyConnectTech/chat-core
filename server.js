import express from "express";
import http from "node:http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { PUBLIC_DIR, VIEWS_DIR } from "#utils/path.js";
import { sequelize } from "#models/index.js";
import socketService from "#services/socket.service.js";
import featureService from "#services/feature.service.js";
import { loadRoutes } from "./routes/index.js";

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

// --- Routes (Dynamic Loading) ---
await loadRoutes(app);

// --- Database & Socket ---
socketService.init(server);

const PORT = process.env.PORT || 3000;

sequelize
    .sync({ alter: true })
    .catch((err) => {
        // Fallback: nếu alter thất bại (ER_TOO_MANY_KEYS, duplicate index...)
        // → chỉ sync cấu trúc cơ bản, không alter
        console.warn("⚠️  sync({ alter: true }) failed, falling back to basic sync:", err.message);
        return sequelize.sync();
    })
    .then(async () => {
        console.log("Database connected & synced");

        // Seed & Load feature flags
        await featureService.seedDefaults();
        await featureService.loadFeatures();

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to database:", err);
    });
