/* eslint-disable  @typescript-eslint/no-explicit-any*/

import { AxiosResponse } from 'axios';
import { IContainer as BottleContainer } from 'bottlejs';
import * as discord from 'discord.js';
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
import { WarningService } from '../services/warning.service';
import { TwitterService } from '../services/twitter.service';
import { GameLeaderboardService } from '../services/gameleaderboard.service';
import { UserService } from '../services/user.service';
import { Document } from 'mongoose';

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
  commandName: string;
  pluginAlias?: string[];
  permission: ChannelType;
  pluginChannelName?: string;
  usableInDM?: boolean;
  usableInGuild?: boolean;
  validate(message: IMessage, args: string[]): boolean;
  hasPermission(message: IMessage): true | string;
  execute(message: IMessage, args?: string[]): Promise<void> | void;
  isActive: boolean;
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
  warningService: WarningService;
  twitterService: TwitterService;
  gameLeaderboardService: GameLeaderboardService;
  userService: UserService;
}

export interface IMessage extends discord.Message {}

export interface IUser extends discord.User {}

export interface IChannelCategory {
  [name: string]: string;
}

export interface IChannel extends discord.Collection<discord.Snowflake, discord.GuildChannel> {}
export interface IHttpResponse extends AxiosResponse {}
export type Voidable = Promise<void> | void;

export interface IHandler {
  execute(...args: any[]): Voidable;
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
  All = 'All',
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
  [pluginName: string]: discord.MessageEmbed | discord.MessageEmbed[];
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
  args: any; // This is what you will send to lambda
}

export interface IReactionOptions {
  reactionCutoff?: number;
  cutoffMessage?: MessageEditData;
  closingMessage?: MessageEditData;
}

export interface IEmbedData {
  embeddedMessage: MessageSendData;
  emojiData: IEmojiTable[]; // This is what you will send to lambda
}

export interface ICommand {
  name: string;
  args: string[];
}

export interface IServerInfo {
  name: ServerInfoType;
}

export type ServerInfoDocument = IServerInfo & Document;

export type ServerInfoType = 'MemberCount';

export type RoleTypeKey = keyof typeof RoleType;
export type Maybe<T> = T | undefined | null;

export type MessageSendData =  string | discord.MessagePayload | (discord.ReplyMessageOptions & { split?: false }); // Discord v13 change

export type MessageEditData = string | discord.MessagePayload;
