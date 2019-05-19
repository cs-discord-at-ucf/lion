import { IContainer as BottleContainer } from 'bottlejs';
import { ClientService } from '../services/discord.service';

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

export interface IService {
  name: String;
  service: any;
}

export interface IContainer extends BottleContainer {
  clientService: ClientService;
}

export enum Mode {
  Development,
  Production,
}
