import { IContainer, IMessage } from '../common/types';
import { CommandHandler } from './handlers/command.handler';

export class Listener {
  private _commandHandler: any;
  constructor(public container: IContainer) {
    this._commandHandler = new CommandHandler(this.container);
    this.container.clientService.on('ready', () => console.log('Lion is now running!'));
    this.container.clientService.on('message', async (message: IMessage) => {
      try {
        await this._commandHandler.execute(message);
      } catch (err) {
        console.error(err);
      }
    });
  }
}
