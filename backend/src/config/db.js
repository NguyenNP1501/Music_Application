const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('../generated/prisma');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/music_app_db';
let poolConfig;

try {
  // Thay thế giao thức để URL parser phân tích chuẩn xác username, password, host, port, db
  const parsedUrl = new URL(databaseUrl.replace(/^mysql:/, 'http:').replace(/^mariadb:/, 'http:'));
  poolConfig = {
    host: parsedUrl.hostname || '127.0.0.1',
    port: Number(parsedUrl.port) || 3306,
    user: decodeURIComponent(parsedUrl.username || 'root'),
    password: decodeURIComponent(parsedUrl.password || ''),
    database: parsedUrl.pathname.replace(/^\//, '') || 'music_app_db',
    // allowPublicKeyRetrieval: true là bắt buộc trên MySQL 8.0/9.0+ dùng caching_sha2_password
    allowPublicKeyRetrieval: true,
    connectionLimit: 10
  };
} catch (e) {
  poolConfig = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'music_app_db',
    allowPublicKeyRetrieval: true,
    connectionLimit: 10
  };
}

const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
