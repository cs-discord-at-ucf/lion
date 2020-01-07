import { AxiosResponse } from 'axios';
import { IContainer as BottleContainer } from 'bottlejs';
import { Collection, GuildChannel, Message, Snowflake, User } from 'discord.js';
import { ChannelService } from '../services/channel.service';
import { ClassService } from '../services/class.service';
import { ClientService } from '../services/client.service';
import { GuildService } from '../services/guild.service';
import { HandlerService } from '../services/handler.service';
import { HttpService } from '../services/http.service';
import { JobService } from '../services/job.service';
import { MessageService } from '../services/message.service';
import { PluginService } from '../services/plugin.service';
import { StoreService } from '../services/store.service';

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
  pluginChannelName?: string;
  validate(message: IMessage, args: string[]): boolean;
  hasPermission(message: IMessage): boolean;
  execute(message: IMessage, args?: string[]): Promise<void>;
}

export interface IContainer extends BottleContainer {
  clientService: ClientService;
  httpService: HttpService;
  guildService: GuildService;
  pluginService: PluginService;
  messageService: MessageService;
  channelService: ChannelService;
  classService: ClassService;
  handlerService: HandlerService;
  jobService: JobService;
  storeService: StoreService;
}

export interface IMessage extends Message {}

export interface IUser extends User {}

export interface IChannelCategory {
  [name: string]: string;
}

export interface IChannel extends Collection<Snowflake, GuildChannel> {}
export interface IHttpResponse extends AxiosResponse {}

export interface IHandler {
  execute(message?: IMessage): Promise<void>;
}

export enum Mode {
  Development = 'development',
  Production = 'production',
}

export enum ChannelType {
  Public = 'Public',
  Staff = 'Staff',
  Admin = 'Admin',
  Private = 'Private',
  Bot = 'Bot',
}

export enum ClassType {
  IT = 'IT',
  CS = 'CS',
  ALL = 'ALL',
}

export interface IClassRequest {
  author: IUser;
  categoryType: ClassType | null;
  requestType: RequestType;
  className: string | undefined;
}

export interface IJob {
  name: string;
  interval: number;
  execute(container?: IContainer): void;
}

export interface IStore {
  name: string;
  state: any;
}

export enum RequestType {
  Channel = 'Channel',
  Category = 'Category',
}
