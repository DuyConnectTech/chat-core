import sequelize from "../config/database.js";
import User from "./User.js";
import Conversation from "./Conversation.js";
import Message from "./Message.js";
import ConversationMember from "./ConversationMember.js";
import PersonalAccessToken from "./PersonalAccessToken.js";
import Session from "./Session.js";
import Setting from "./Setting.js";

// --- Associations ---

// User <-> Conversation (Many-to-Many via ConversationMember)
User.belongsToMany(Conversation, { through: ConversationMember, foreignKey: "user_id" });
Conversation.belongsToMany(User, { through: ConversationMember, foreignKey: "conversation_id" });

// User <-> Message (One-to-Many)
User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });

// Conversation <-> Message (One-to-Many)
Conversation.hasMany(Message, { foreignKey: "conversation_id" });
Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

// Conversation <-> Last Message (One-to-One)
Conversation.belongsTo(Message, { as: "lastMessage", foreignKey: "last_message_id", constraints: false });

// Conversation <-> Owner (One-to-Many)
User.hasMany(Conversation, { foreignKey: "owner_id", as: "ownedGroups" });
Conversation.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// --- New Auth Flow Associations ---

// User <-> PersonalAccessToken
User.hasMany(PersonalAccessToken, { foreignKey: "user_id" });
PersonalAccessToken.belongsTo(User, { foreignKey: "user_id" });

// User <-> Session
User.hasMany(Session, { foreignKey: "user_id" });
Session.belongsTo(User, { foreignKey: "user_id" });

// Session <-> PersonalAccessToken
PersonalAccessToken.hasOne(Session, { foreignKey: "refresh_token_id" });
Session.belongsTo(PersonalAccessToken, { foreignKey: "refresh_token_id", as: "refreshToken" });

export { sequelize, User, Conversation, Message, ConversationMember, PersonalAccessToken, Session, Setting };
