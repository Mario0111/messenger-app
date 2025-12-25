const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();

console.log('URL:', process.env.DATABASE_URL);

try {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
    console.log('Client initialized');

    prisma.$connect().then(() => {
        console.log('Connected successfully');
        process.exit(0);
    }).catch(e => {
        console.error('Connection failed:', e);
        process.exit(1);
    });

} catch (e) {
    console.error('Init failed:', e);
}
