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

let _listener!: Listener;
let _webServer!: Express;
let container!: IContainer;
let _webServerInstance: Server.Server | undefined;

function makeContainer(): IContainer {
  const containerBuilder = new Bottle();
  new Container(containerBuilder);
  containerBuilder.resolve({});
  return containerBuilder.container as IContainer;
}

export async function startBot() {
  const bot = new Bot();
  bot.run();
}

async function _loadAndRun(this: Bot) {
  await this._registerPlugins();
  this._registerJobs();
  this._registerStores();
  this._registerWebServer();
}

async function _registerPlugins(this: Bot) {
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
      // property, but this should be fine for now
      if (result.success) {
        slashCommands.set(plugin.commandName, result.data as ISlashCommand);
        plugin.initialize?.(this.container);
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
    this.container.clientService.guilds.cache.map((guild) =>
      guild.commands.set(slashCommandUploads)
    )
  );
}

function _registerJobs(this: Bot) {
  container.jobService.reset();

  const jobs = container.jobService.jobs;
  for (const job of jobs) {
    container.jobService.register(job, container);
  }
}

function _registerStores(this: Bot) {
  container.storeService.reset();

  container.storeService.stores.forEach((store: Store) => {
    container.storeService.register(store);
  });
}

function _registerWebServer(this: Bot) {
  // reset web server before trying to init again, in case we are retrying
  this._resetWebServer();

  const defaultPort = 3000;
  _webServerInstance = _webServer.listen(process.env.WEBSERVER_PORT ?? defaultPort, () =>
    container.loggerService.info('Webserver is now running')
  );

  _webServer.get('/health', (_, res) => res.send('OK'));
}

function _resetWebServer(this: Bot) {
  _webServerInstance?.close((err) => {
    if (err) {
      container.loggerService.error('While closing webServerInstance: ' + err);
    }
  });
}

async function run(this: Bot) {
  try {
    container.loggerService.info('Loading and running Bot...');

    this.container.clientService.on('ready', async () => {
      await this._loadAndRun();
      this.container.loggerService.info('Bot loaded.');
    });

    try {
      await _listener.container.storageService.connectToDB();
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
export class Bot {
  _listener!: Listener;
  _webServer!: Express;
  container!: IContainer;
  _webServerInstance: Server.Server | undefined;

  constructor() {
    this.container = makeContainer();
    this._listener = new Listener(this.container);
    this._webServer = express();
  }
  _loadAndRun = _loadAndRun;
  _registerPlugins = _registerPlugins;
  _registerJobs = _registerJobs;
  _registerStores = _registerStores;
  _registerWebServer = _registerWebServer;
  _resetWebServer = _resetWebServer;
  run = run;
}
