import { IContainer, IMessage, IHandler } from '../common/types';

export class Listener {
  private _handlers: IHandler[] = [];

  constructor(public container: IContainer) {
    this._initializeHandlers();
    // TODO (joey-colon): Abstract this into its own ChannelHandler class where all channel event logic is held.
    this.container.clientService.on('channelCreate', () => {
      this.container.classService.updateClasses();
    });
    this.container.clientService.on('channelDelete', () => {
      this.container.classService.updateClasses();
    });
    this.container.clientService.on('channelUpdate', () => {
      this.container.classService.updateClasses();
    });

    this.container.clientService.on('ready', () => console.log('Lion is now running!'));
    this.container.clientService.on('message', async (message: IMessage) => {
      if (message.author.bot) {
        return;
      }
      try {
        this._handlers.forEach(async (handler: IHandler) => {
          await handler.execute(message);
        });
      } catch (err) {
        console.error(err);
      }
    });
  }

  private _initializeHandlers(): void {
    this.container.handlerService.handlers.forEach((Handler) => {
      this._handlers.push(new Handler(this.container));
    });
  }
}
