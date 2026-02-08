import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Session = sequelize.define(
    "Session",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        refresh_token_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        last_activity_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "sessions",
        underscored: true,
    },
);

export default Session;
