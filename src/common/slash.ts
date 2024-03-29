import {
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  BaseCommandInteraction,
  CommandInteraction,
  MessageContextMenuInteraction,
  UserContextMenuInteraction,
  PermissionResolvable,
} from 'discord.js';
import { z } from 'zod';
import { IContainer } from './types';

export const commands: Map<string, Command> = new Map();

export const CommandValidator = z.object({
  type: z.optional(z.string()),
  commandName: z.string(),
  name: z.string(),
  description: z.optional(z.string()),
  options: z.optional(z.array(z.any())),
  defaultMemberPermissions: z.optional(z.any()),
  execute: z
    .function()
    .args(z.any())
    .returns(z.union([z.void(), z.promise(z.void())])),
  initialize: z.optional(
    z
      .function()
      .args(z.any())
      .returns(z.union([z.void(), z.promise(z.void())]))
  ),
  autocomplete: z.optional(
    z
      .function()
      .args(z.any())
      .returns(z.union([z.void(), z.promise(z.void())]))
  ),
});

export interface ICommand {
  commandName: string;
  name: string;
  description?: string | undefined;
  defaultMemberPermissions?: PermissionResolvable;
  execute({
    interaction,
    container,
  }: {
    interaction: BaseCommandInteraction;
    container: IContainer;
  }): void | Promise<void>;
}

export interface IUserCommand extends ICommand {
  type: 'USER';
  description?: undefined;
  options?: undefined;
  execute({
    interaction,
    container,
  }: {
    interaction: UserContextMenuInteraction;
    container: IContainer;
  }): void | Promise<void>;
}

export interface IMessageCommand extends ICommand {
  type: 'MESSAGE';
  description?: undefined;
  options?: undefined;
  execute({
    interaction,
    container,
  }: {
    interaction: MessageContextMenuInteraction;
    container: IContainer;
  }): void | Promise<void>;
}

export interface ISlashCommand extends ICommand {
  type?: 'CHAT_INPUT';
  options?: ApplicationCommandOptionData[];
  description: string;

  execute({
    interaction,
    container,
  }: {
    interaction: CommandInteraction;
    container: IContainer;
  }): void | Promise<void>;
  autocomplete?({
    interaction,
    container,
  }: {
    interaction: AutocompleteInteraction;
    container: IContainer;
  }): void | Promise<void>;
  initialize?(container: IContainer): void | Promise<void>;
}

export type Command = IUserCommand | IMessageCommand | ISlashCommand;
