import express, { Express } from 'express';
import { readdir } from 'fs/promises';
import Server from 'http';
import path from 'path';
import { Plugin } from '../common/plugin';
import { ISlashCommand, SlashCommand, slashCommands } from '../common/slash';
import { Store } from '../common/store';
import { IContainer } from '../common/types';
import { Listener } from './listener';
import Bottle from 'bottlejs';
import { Container } from '../bootstrap/container';

let listener: Listener;
let webServer: Express;
let container: IContainer;
let webServerInstance: Server.Server | undefined;

function makeContainer(): IContainer {
  const containerBuilder = new Bottle();
  new Container(containerBuilder);
  containerBuilder.resolve({});
  return containerBuilder.container as IContainer;
}

export async function startBot() {
  container = makeContainer();
  listener = new Listener(container);
  webServer = express();
  run();
}

async function registerPlugins() {
  container.pluginService.reset();

  // load classic plugins
  const pluginFolder = path.join(__dirname, '/plugins');
  const pluginFiles = await readdir(pluginFolder);
  await Promise.allSettled(
    pluginFiles.map(async (file) => {
      // Make sure file is proper.
      if (!file.endsWith('.ts') && !file.endsWith('.js')) {
        return;
      }

      // Import the class from the plugin file.
      const pluginInstance = await import(`./plugins/${file}`);

      // Try to see if it's in the proper form.
      try {
        // Check constructor.
        const plugin = new pluginInstance.default(container);

        // Check instance.
        if (!(plugin instanceof Plugin)) {
          container.loggerService.error(
            `${file} has a default export, but it is not of type Plugin`
          );
          return;
        }

        // Register plugin.
        container.pluginService.register(plugin);
      } catch (err) {
        container.loggerService.warn(`${file} doesn't have a default export of type Plugin!`);
      }
    })
  );

  // load slash plugins
  const slashPluginFolder = path.join(__dirname, '/slash_plugins');
  const slashPluginFiles = await readdir(slashPluginFolder);
  await Promise.allSettled(
    slashPluginFiles.map(async (file) => {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) {
        return;
      }

      const plugin = await import(`./slash_plugins/${file}`).then((m) => m.default);

      const result = SlashCommand.safeParse(plugin);
      // FIXME we could validate more here: for example, checking the parameters
      // property, but bot should be fine for now
      if (result.success) {
        slashCommands.set(plugin.commandName, result.data as ISlashCommand);
        plugin.initialize?.(container);
      } else {
        container.loggerService.warn(
          `${file} does not \`export default\` a plugin with type ISlashCommand!`
        );
        container.loggerService.warn(result.error);
      }
    })
  );

  const slashCommandUploads = Array.from(slashCommands.entries()).map(([key, command]) => {
    return {
      name: key,
      description: command.description.substring(0, 99),
      options: command.options,
    };
  });
  // Register commands for all guilds.
  await Promise.all(
    container.clientService.guilds.cache.map((guild) =>
      guild.commands.set(slashCommandUploads)
    )
  );
}

function registerWebServer() {
  // reset web server before trying to init again, in case we are retrying
  webServerInstance?.close((err) => {
    if (err) {
      container.loggerService.error('While closing webServerInstance: ' + err);
    }
  });

  const defaultPort = 3000;
  webServerInstance = webServer.listen(process.env.WEBSERVER_PORT ?? defaultPort, () =>
    container.loggerService.info('Webserver is now running')
  );

  webServer.get('/health', (_, res) => res.send('OK'));
}

async function run() {
  try {
    container.loggerService.info('Loading and running Bot...');

    container.clientService.on('ready', async () => {
      await registerPlugins();
      // register jobs
      container.jobService.reset();

      const jobs = container.jobService.jobs;
      for (const job of jobs) {
        container.jobService.register(job, container);
      }
      // register stores
      container.storeService.reset();

      container.storeService.stores.forEach((store: Store) => {
        container.storeService.register(store);
      });
      registerWebServer();
      container.loggerService.info('Bot loaded.');
    });

    try {
      await listener.container.storageService.connectToDB();
    } catch (e) {
      container.loggerService.error(`Could not connect to db: ${e}`);
    }

    while (true) {
      const waiting = new Promise((resolve) => setTimeout(resolve, 1_000_000_000));
      await waiting;
    }
  } catch (e) {
    container.loggerService.error('Bot crashed with error: ' + e);
  }
}
