const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('../generated/prisma');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/music_app_db';
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
