import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('private', 'group'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true // NULL nếu là chat 1-1
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_message_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'conversations'
});

export default Conversation;
