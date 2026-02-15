import { sequelize } from '../models/index.js';

async function migrate() {
    try {
        console.log('Starting migration...');
        await sequelize.authenticate();
        console.log('Database connected.');
        
        await sequelize.sync({ alter: true });
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
