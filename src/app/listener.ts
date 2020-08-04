import { IContainer, IHandler, IMessage } from '../common/types';

export class Listener {
  private _messageHandlers: IHandler[] = [];
  private _channelHandlers: IHandler[] = [];

  constructor(public container: IContainer) {
    this._initializeHandlers();

    this.container.clientService.on('channelCreate', async () => {
      await this._executeHandlers(this._channelHandlers);
    });
    this.container.clientService.on('channelDelete', async () => {
      await this._executeHandlers(this._channelHandlers);
    });
    this.container.clientService.on('channelUpdate', async () => {
      await this._executeHandlers(this._channelHandlers);
    });

    this.container.clientService.on('ready', () => {
      this.container.loggerService.get().info(`Loaded ${this.container.jobService.size()} jobs...`);
      this.container.loggerService.get().info('Lion is now running!');
    });

    this.container.clientService.on('message', async (message: IMessage) => {
      if (message.author.bot) {
        return;
      }
      await this._executeHandlers(this._messageHandlers, message);
    });
  }

  private _initializeHandlers(): void {
    this.container.handlerService.messageHandlers.forEach((Handler) => {
      this._messageHandlers.push(new Handler(this.container));
    });

    this.container.handlerService.channelHandlers.forEach((Handler) => {
      this._channelHandlers.push(new Handler(this.container));
    });
  }

  private async _executeHandlers(handlers: IHandler[], message?: IMessage) {
    handlers.forEach(async (handler: IHandler) => {
      try {
        await handler.execute(message);
      } catch (e) {
        this.container.loggerService.get().error(e);
      }
    });
  }
}
