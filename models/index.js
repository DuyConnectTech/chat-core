import sequelize from '../config/database.js';
import User from './User.js';
import Conversation from './Conversation.js';
import ConversationMember from './ConversationMember.js';
import Message from './Message.js';
import Setting from './Setting.js';

// --- Associations ---

// User <-> Conversation (Many-to-Many)
User.belongsToMany(Conversation, { 
  through: ConversationMember, 
  foreignKey: 'user_id',
  otherKey: 'conversation_id'
});
Conversation.belongsToMany(User, { 
  through: ConversationMember, 
  foreignKey: 'conversation_id',
  otherKey: 'user_id'
});

// Conversation <-> ConversationMember (One-to-Many)
Conversation.hasMany(ConversationMember, { foreignKey: 'conversation_id' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// User <-> ConversationMember (One-to-Many)
User.hasMany(ConversationMember, { foreignKey: 'user_id' });
ConversationMember.belongsTo(User, { foreignKey: 'user_id' });

// Conversation <-> Message (One-to-Many)
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// User <-> Message (One-to-Many)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Conversation <-> Last Message (One-to-One)
Conversation.belongsTo(Message, { foreignKey: 'last_message_id', as: 'lastMessage', constraints: false });

export {
  sequelize,
  User,
  Conversation,
  ConversationMember,
  Message,
  Setting
};
