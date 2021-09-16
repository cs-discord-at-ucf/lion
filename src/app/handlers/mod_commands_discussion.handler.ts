import { MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { IContainer, IHandler, IMessage } from '../../common/types';

export class ModCommandsDiscussionHandler implements IHandler {
  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    if ((message.channel as TextChannel).name !== Constants.Channels.Staff.ModCommands) {
      return;
    }

    if (message.content.startsWith('!')) {
      return;
    }

    // Only remind 10% of the time
    if (Math.random() <= 0.9) {
      return;
    }

    const modChatChan = this.container.guildService.getChannel(Constants.Channels.Staff.ModChat);
    const embed = new MessageEmbed();
    embed.setColor('#f58142');
    embed.setTitle('Please try to limit discussion in this channel');
    embed.setDescription(
      'Other mods have message notifications on for this channel, so lots ' +
        'of messages can get really annoying. You can either move the conversation ' +
        `to ${modChatChan}, or make a thread based on the report.\n Thanks :)`
    );

    await message.reply({ embeds: [embed] });
  }
}
