import { MessageEmbed} from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';

export default class SuggestionPlugin extends Plugin {
  public commandName: string = 'suggest';
  public name: string = 'Suggestions Plugin';
  public description: string = 'Create suggestions for lion to output';
  public usage: string = 'suggest <string>';
  public override pluginChannelName: string = Constants.Channels.Public.ServerRequests;
  public permission: ChannelType = ChannelType.All;
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const embed = new MessageEmbed();
    const suggestion = args.join(' ');
    // Combines input
    embed.setTitle('Suggestion:');
    embed.setDescription(suggestion);
    await message.reply({ embeds: [embed] });
  }
}
