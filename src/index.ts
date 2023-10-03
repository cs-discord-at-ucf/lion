import Bottle from 'bottlejs';
import { ApplicationCommandDataResolvable } from 'discord.js';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import express from 'express';
import { readdir } from 'fs/promises';
import path from 'path';
import { Listener } from './app/listener';
import { Container } from './bootstrap/container';
import { CommandValidator, ISlashCommand, commands } from './common/slash';
import { IContainer } from './common/types';

// Load env vars in.
dotenv.config();

// Make sure promise rejections are handled.
EventEmitter.captureRejections = true;

const commandsFolderName = 'commands';
const commandsFolderPath = path.join(__dirname, `./app/${commandsFolderName}`);

(async () => {
  const containerBuilder = new Bottle();
  new Container(containerBuilder);
  containerBuilder.resolve({});
  const container = containerBuilder.container as IContainer;
  const listener = new Listener(container);
  const webServer = express();
  try {
    container.loggerService.info('Loading and running Bot...');

    container.clientService.on('ready', async () => {
      container.pluginService.reset();

      // load application commands
      const commandFiles = await readdir(commandsFolderPath);
      await Promise.allSettled(
        commandFiles.map(async (file) => {
          if (!file.endsWith('.ts') && !file.endsWith('.js')) {
            return;
          }

          const command = await import(path.join(commandsFolderPath, file)).then((m) => m.default);

          const result = CommandValidator.safeParse(command);
          // FIXME we could validate more here: for example, checking the parameters
          // property, but bot should be fine for now
          if (result.success) {
            commands.set(command.commandName, result.data as ISlashCommand);
            command.initialize?.(container);
          } else {
            container.loggerService.warn(
              `${file} does not \`export default\` a plugin with type ISlashCommand!`
            );
            container.loggerService.warn(result.error);
          }
        })
      );

      const slashCommandUploads = Array.from(commands.entries()).map(([key, command]) => {
        return {
          type: command.type,
          name: key,
          description: command.description?.substring(0, 99),
          options: command.options,
          defaultMemberPermissions: command.defaultMemberPermissions ?? 'SEND_MESSAGES',
          dmPermissions: false,
        } as ApplicationCommandDataResolvable;
      });
      // Register commands for all guilds.
      await Promise.all(
        container.clientService.guilds.cache.map((guild) => guild.commands.set(slashCommandUploads))
      );

      // register jobs
      container.jobService.reset();

      const jobs = container.jobService.jobs;
      for (const job of jobs) {
        container.jobService.register(job, container);
      }
      // register stores
      container.storeService.reset();

      for (const store of container.storeService.stores) {
        container.storeService.register(store);
      }
      // register webserver
      const defaultPort = 3000;
      webServer.listen(process.env.WEBSERVER_PORT ?? defaultPort, () =>
        container.loggerService.info('Webserver is now running')
      );

      webServer.get('/health', (_, res) => res.send('OK'));
      container.loggerService.info('Bot loaded.');
    });

    try {
      await listener.container.storageService.connectToDB();
    } catch (e) {
      container.loggerService.error(`Could not connect to db: ${e}`);
    }
  } catch (e) {
    container.loggerService.error('Bot crashed with error: ' + e);
  }
})();
