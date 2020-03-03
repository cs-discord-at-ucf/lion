import { IMessage, IContainer, IHandler } from '../../common/types';
import { DMChannel } from 'discord.js';

export class DMHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    if (!(message.channel instanceof DMChannel)) {
      return;
    }
  }
}
