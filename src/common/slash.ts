import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";

export default interface ISlashPlugin {
  parameters: ApplicationCommandOptionData[];
  run(command: CommandInteraction): void | Promise<void>;
}