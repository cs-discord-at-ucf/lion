import express, { Express } from 'express';
import { readdir } from 'fs/promises';
import Server from 'http';
import path from 'path';
import { Kernel } from '../bootstrap/kernel';
import { Plugin } from '../common/plugin';
import { ISlashCommand, SlashCommand, slashCommands } from '../common/slash';
import { Store } from '../common/store';
import { IContainer } from '../common/types';
import { Listener } from './listener';

export class Bot {
  private _kernel!: Kernel;
  private _listener!: Listener;
  private _webServer!: Express;
  public container!: IContainer;
  private _webServerInstance: Server.Server | undefined;

  constructor() {
    this._initialise();
  }

  private _initialise(): void {
    this._kernel = new Kernel();
    this.container = this._kernel.getContainer();
    this._listener = new Listener(this.container);
    this._webServer = express();
  }

  private async _loadAndRun() {
    await this._registerPlugins();
    this._registerJobs();
    this._registerStores();
    this._registerWebServer();
  }

  private async _registerPlugins() {
    this.container.pluginService.reset();

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
          const plugin = new pluginInstance.default(this.container);

          // Check instance.
          if (!(plugin instanceof Plugin)) {
            this.container.loggerService.error(
              `${file} has a default export, but it is not of type Plugin`
            );
            return;
          }

          // Register plugin.
          this.container.pluginService.register(plugin);
        } catch (err) {
          this.container.loggerService.warn(
            `${file} doesn't have a default export of type Plugin!`
          );
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
        } else {
          this.container.loggerService.warn(
            `${file} does not \`export default\` a plugin with type ISlashCommand!`
          );
          this.container.loggerService.warn(result.error);
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

  private _registerJobs() {
    this.container.jobService.reset();

    const jobs = this.container.jobService.jobs;
    for (const job of jobs) {
      this.container.jobService.register(job, this.container);
    }
  }

  private _registerStores() {
    this.container.storeService.reset();

    this.container.storeService.stores.forEach((store: Store) => {
      this.container.storeService.register(store);
    });
  }

  private _registerWebServer() {
    // reset web server before trying to init again, in case we are retrying
    this._resetWebServer();

    const defaultPort = 3000;
    this._webServerInstance = this._webServer.listen(
      process.env.WEBSERVER_PORT ?? defaultPort,
      () => this.container.loggerService.info('Webserver is now running')
    );

    this._webServer.get('/health', (_, res) => res.send('OK'));
  }

  private _resetWebServer() {
    this._webServerInstance?.close((err) => {
      if (err) {
        this.container.loggerService.error('While closing webServerInstance: ' + err);
      }
    });
  }

  public async run() {
    try {
      this.container.loggerService.info('Loading and running Bot...');

      // Only start registration once the initial cache is populated.
      this.container.clientService.on('ready', async () => {
        await this._loadAndRun();
        this.container.loggerService.info('Bot loaded.');
      });

      try {
        await this._listener.container.storageService.connectToDB();
      } catch (e) {
        this.container.loggerService.error(`Could not connect to db: ${e}`);
      }

      while (true) {
        const waiting = new Promise((resolve) => setTimeout(resolve, 1_000_000_000));
        await waiting;
      }
    } catch (e) {
      this.container.loggerService.error('Bot crashed with error: ' + e);
    }
  }
}
