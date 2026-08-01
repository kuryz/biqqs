import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

export const env = {
    app: {
        port: Number(process.env.PORT ?? 3000),
        nodeEnv: process.env.NODE_ENV ?? "development"
    },
    mysql: {
        host: required("MYSQL_HOST"),
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: required("MYSQL_USER"),
        password: process.env.MYSQL_PASSWORD ?? '',
        database: required("MYSQL_DATABASE"),
        connectionLimit: Number(
            process.env.MYSQL_POOL_SIZE ?? 10
        )
    },

    redis: {
        url: process.env.REDIS_URL ?? ""
    },
    telegram: {
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        token: process.env.TELEGRAM_BOT_TOKEN ?? ""
    },
    whatsapp: {
        enabled: Boolean(process.env.WHATSAPP_TOKEN),
        token: process.env.WHATSAPP_TOKEN ?? "",
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
        apiVersion: process.env.WHATSAPP_API_VERSION ?? "v20.0"
    },
    cache: {
        ttl: Number(process.env.CACHE_TTL_SECONDS ?? 60)
    }
};