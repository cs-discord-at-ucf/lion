import { CommandInteraction } from 'discord.js';
import ISlashPlugin from '../../common/slash';
import * as types from '../../common/types';

export class SlashCommandHandler implements types.IHandler {
  constructor(public container: types.IContainer) {}

  public async execute(command: CommandInteraction): Promise<void> {
    const { plugins } = this.container.pluginService;
    const { commandName } = command;

    const plugin = plugins[commandName];

    if (!types.isSlashCommand(plugin)) {
      return;
    }

    await (plugin as unknown as ISlashPlugin).run(command);
  }
}