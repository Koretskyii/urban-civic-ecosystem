import { registerAs } from "@nestjs/config";

export const dbConfig = registerAs('db', () => {
    return {
        url: process.env.DATABASE_URL,
    }
})