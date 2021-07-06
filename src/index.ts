import { Bot } from './app/bot';
import dotenv from 'dotenv';
import { LoggerService } from './services/logger.service';

// Init logger.
LoggerService.init();

// Load env vars in.
dotenv.config();

const app = new Bot();
app.run();
