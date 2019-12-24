import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class PubSubPlugin extends Plugin {
  public name: string = 'Pub Sub Plugin';
  public description: string = 'Are publix chicken tender subs on sale?';
  public usage: string = '';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const state = this.container.storeService.get('pubSubStore').state;
    if (state?.onSale) {
      message.reply('Chicken tender subs are on sale :eyes:');
    } else {
      message.reply('Chicken tender subs are **NOT** on sale.');
    }
  }
}
