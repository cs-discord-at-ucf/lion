import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { IContainer } from './types';
import { z } from 'zod';

export const slashCommands: Map<string, ISlashCommand> = new Map();

export const SlashCommand = z.object({
  commandName: z.string(),
  name: z.string(),
  description: z.string(),
  options: z.optional(z.array(z.any())),
  execute: z
    .function()
    .args(z.any())
    .returns(z.union([z.void(), z.promise(z.void())])),
});

export interface ISlashCommand {
  commandName: string;
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  execute({
    interaction,
    container,
  }: {
    interaction: CommandInteraction;
    container: IContainer;
  }): void | Promise<void>;
}
