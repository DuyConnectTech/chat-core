import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ConversationMember = sequelize.define(
    "ConversationMember",
    {
        conversation_id: {
            type: DataTypes.UUID,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            primaryKey: true,
        },
        role: {
            type: DataTypes.ENUM("member", "admin"),
            defaultValue: "member",
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "conversation_members",
        timestamps: false, // Chúng ta dùng joined_at thay cho createdAt/updatedAt
    },
);

export default ConversationMember;
