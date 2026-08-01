import dotenv from 'dotenv';

dotenv.config();

import { App } from './app';
import { database } from './db/pool';

const app = new App();

const port = Number(process.env.PORT) || 3000;

async function bootstrap() {
    await database.connect();
    app.express.listen(
        port,
        () => {
            console.log(`🚀 Server running on ${port}`);
        }
    );
}
bootstrap();