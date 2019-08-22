import { IHandler, IMessage, IContainer } from '../../common/types';

export class BlacklistHandler implements IHandler {
  private _expressions: RegExp[] = [/discord.gg/, /group\s?me/];
  constructor(public container: IContainer) {}

  public async execute(message: IMessage): Promise<void> {
    this._expressions.forEach((expression) => {
      if (message.content.toLowerCase().match(expression)) {
        this.container.messageService.sendBotReport(message);
      }
    });
  }
}
