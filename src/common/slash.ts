import {
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  CommandInteraction,
  PermissionResolvable,
} from 'discord.js';
import { z } from 'zod';
import { IContainer } from './types';

export const slashCommands: Map<string, ISlashCommand> = new Map();

export const SlashCommand = z.object({
  commandName: z.string(),
  name: z.string(),
  description: z.string(),
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

export interface ISlashCommand {
  commandName: string;
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: PermissionResolvable;
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
