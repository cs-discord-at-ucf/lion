import { GuildMember } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';

export class AcknowledgeHandler implements IHandler {
  constructor(public container: IContainer) { }

  public async execute(member: GuildMember): Promise<void> {
    console.log("Running");
  }
}
