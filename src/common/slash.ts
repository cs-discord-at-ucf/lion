import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";

export default interface ISlashPlugin {
  name: string,
  description: string,
  parameters: ApplicationCommandOptionData[];
  run(command: CommandInteraction): void | Promise<void>;
}