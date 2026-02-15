import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

const Message = sequelize.define(
    "Message",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        conversation_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("text", "image", "audio", "system", "ai"),
            defaultValue: "text",
        },
        is_recalled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true, // Chứa url ảnh, duration audio, size...
        },
        deleted_for: {
            type: DataTypes.JSON,
            defaultValue: [], // Lưu mảng user IDs đã xóa tin này phía họ
        },
    },
    {
        tableName: "messages",
    },
);

export default Message;
