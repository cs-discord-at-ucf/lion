import { GuildMember, MessageEmbed } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';
import winston from 'winston';

export class WelcomeHandler implements IHandler {
  private _LION_URL: string = 'https://github.com/joey-colon/lion';

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const shouldUnverify = this.container.userService.shouldUnverify(member);
    const embed = this._createEmbed(shouldUnverify);
    await member
      .send(embed)
      .catch(() =>
        winston.debug(`Couldn't DM new user ${member.user.tag}`)
      );
  }

  private _createEmbed(shouldUnverfiy: boolean) {
    const embed = new MessageEmbed();
    embed.title = 'Welcome!';
    embed.setURL(this._LION_URL);

    const icon = this.container.guildService.get().iconURL();
    if (icon) {
      embed.setThumbnail(icon);
    }

    embed.addField(
      `Welcome to the ${Constants.ServerName}!`,
      `I am Lion, our server's in house bot that been created from scratch by the students in our discord!\
      I am being developed in \`#${Constants.Channels.Public.LionProject}\` where you can help too!`,
      false
    );
    embed.addField(
      'Getting started',
      `To join a custom channel for your CS, ECE, or IT class, go to \`#${Constants.Channels.Bot.BotChannel}\`\
      and type \`!register <className_professor>\`\nWhile you are there, try \`!help\` to see what I can do!`,
      false
    );
    embed.addField(
      'Read our Code of Conduct',
      `Please read our \`#${Constants.Channels.Info.CodeOfConduct}\` and react to the message to show you\
      acknowledge our guidelines.`,
      true
    );

    if (shouldUnverfiy) {
      embed.addField(
        'You have been marked as Unverified in our server',
        'Please post your UCF schedule in `#verify` so one of our Moderators can verify you.',
        true
      );
    }
    return embed;
  }
}
