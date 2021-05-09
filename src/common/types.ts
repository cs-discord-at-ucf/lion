import { AxiosResponse } from 'axios';
import { IContainer as BottleContainer } from 'bottlejs';
import { Collection, GuildChannel, Message, Snowflake, User, MessageEmbed } from 'discord.js';
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
import { ModService } from '../services/moderation.service';
import { StorageService } from '../services/storage.service';
import { LoggerService } from '../services/logger.service';
import { RoleService } from '../services/role.service';
import { PollService } from '../services/poll.service';

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
  pluginAlias?: string[];
  permission: ChannelType;
  pluginChannelName?: string;
  usableInDM?: boolean;
  usableInGuild?: boolean;
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
  modService: ModService;
  storageService: StorageService;
  loggerService: LoggerService;
  roleService: RoleService;
  pollService: PollService;
}

export interface IMessage extends Message {}

export interface IUser extends User {}

export interface IChannelCategory {
  [name: string]: string;
}

export interface IChannel extends Collection<Snowflake, GuildChannel> {}
export interface IHttpResponse extends AxiosResponse {}

export interface IHandler {
  execute(...args: any[]): Promise<void>;
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
  GRAD = 'GRAD',
  EE = 'EE',
  GENED = 'GENED',
  ALL = 'ALL',
}

export interface IClassRequest {
  author: IUser;
  categoryType: ClassType | undefined;
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

export interface ILoggerWrapper {
  error(message: any, ...args: any[]): any;
  warn(message: any, ...args: any[]): any;
  help(message: any, ...args: any[]): any;
  data(message: any, ...args: any[]): any;
  info(message: any, ...args: any[]): any;
  debug(message: any, ...args: any[]): any;
  prompt(message: any, ...args: any[]): any;
  http(message: any, ...args: any[]): any;
  verbose(message: any, ...args: any[]): any;
  input(message: any, ...args: any[]): any;
  silly(message: any, ...args: any[]): any;
}

export interface IPluginHelp {
  [pluginName: string]: MessageEmbed | MessageEmbed[];
}

export interface ICommandLookup {
  [command: string]: string;
}

export interface IPluginLookup {
  [pluginName: string]: IPlugin;
}

export enum RoleType {
  'Suspended' = -10,
  'RegularUser' = 0,
  'Teaching Assistant' = 20,
  'Moderator' = 30,
  'Admin' = 40,
}

export interface IPluginEvent {
  status: string;
  pluginName: string;
  args: string[];
  error?: string;
  user: string;
}

export interface IEmojiTable {
  emoji: string;
  emojiValue: any; // This is what you will send to lambda
}

export type RoleTypeKey = keyof typeof RoleType;
export type Maybe<T> = T | undefined | null;
