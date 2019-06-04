import { IContainer as BottleContainer } from 'bottlejs';
import { ClientService } from '../services/discord.service';
import { HttpService } from '../services/http.service';
import { PluginService } from '../services/plugin.service';
import { Message } from 'discord.js';

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
  validate(message: IMessage): boolean;
  hasPermission(message: IMessage): boolean;
  execute(args?: string[]): void;
}

export interface IContainer extends BottleContainer {
  clientService: ClientService;
  httpService: HttpService;
  pluginService: PluginService;
}

export interface IMessage extends Message {}


export enum Mode {
  Development,
  Production,
}
