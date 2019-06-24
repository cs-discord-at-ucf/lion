import { IContainer as BottleContainer } from 'bottlejs';
import { ClientService } from '../services/client.service';
import { HttpService } from '../services/http.service';
import { PluginService } from '../services/plugin.service';
import { Message, User } from 'discord.js';
import { MessageService } from '../services/message.service';
import { ChannelService } from '../services/channel.service';
import { AxiosResponse } from 'axios';

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
  permission: ChannelType;
  validate(message: IMessage, args: string[]): boolean;
  hasPermission(message: IMessage): boolean;
  execute(message: IMessage, args?: string[]): void;
}

export interface IContainer extends BottleContainer {
  clientService: ClientService;
  httpService: HttpService;
  pluginService: PluginService;
  messageService: MessageService;
  channelService: ChannelService;
}

export interface IMessage extends Message {}

export interface IUser extends User {}

export interface IChannelCategory {
  [name: string]: string;
}

export interface IHttpResponse extends AxiosResponse {}

export enum Mode {
  Development,
  Production,
}

export enum ChannelType {
  Public = 'Public',
  Staff = 'Staff',
  Admin = 'Admin',
  Private = 'Private',
}
