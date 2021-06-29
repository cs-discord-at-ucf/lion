import { Bot } from './app/bot';
import dotenv from 'dotenv';

// Load env vars in.
dotenv.config();

const app = new Bot();
app.run();
