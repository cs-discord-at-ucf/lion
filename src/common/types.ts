import { IContainer as BottleContainer } from 'bottlejs';
import { ClientService } from '../services/discord.service';
import { HttpService } from '../services/http.service';
import { PluginService } from '../services/plugin.service';

export interface IConfig {
  token: string;
  mode: Mode;
}

export interface IBot {
  run(): void;
}

export interface IPlugin {
  name: string;
  description: string;
  usage: string;
  validate(): boolean;
  hasPermission(): boolean;
  execute(): void;
}

export interface IContainer extends BottleContainer {
  clientService: ClientService;
  httpService: HttpService;
  pluginService: PluginService;
}

export enum Mode {
  Development,
  Production,
}
