import { MessageEmbed} from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class SuggestionPlugin extends Plugin {
  public commandName: string = 'suggest';
  public name: string = 'Suggestions Plugin';
  public description: string = 'Create suggestions for lion to output';
  public usage: string = 'suggest <string>';
  public permission: ChannelType = ChannelType.All;
  private _embed: MessageEmbed = new MessageEmbed();
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const suggestion = args.join(' ');
    // Combines input
    this._embed.setTitle('Suggestion:');
    this._embed.setDescription(suggestion);
    await message.reply({ embeds: [this._embed] });
  }
}
