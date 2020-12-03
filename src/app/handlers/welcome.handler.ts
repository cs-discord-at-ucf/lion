import { GuildMember, RichEmbed } from 'discord.js';
import { IContainer, IHandler } from '../../common/types';
import Constants from '../../common/constants';

export class WelcomeHandler implements IHandler {
  private _LION_URL: string = 'https://github.com/joey-colon/lion';

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const hasAvatar = Boolean(member.user.avatar);
    const embed = this._createEmbed(hasAvatar);
    try {
      member.send(embed);
    } catch (e) {}
  }

  private _createEmbed(isVerified: boolean) {
    const embed = new RichEmbed();
    embed.title = 'Welcome!';
    embed.setThumbnail(this.container.guildService.get().iconURL);
    embed.setURL(this._LION_URL);

    embed.addField(
      `Welcome to the ${Constants.ServerName}!`,
      `I am Lion, our server's in house bot that been created from scratch by the students in our discord!\
      I am being developed in \`#${Constants.Channels.Public.LionProject}\` where you can help too!`,
      false
    );
    embed.addField(
      `Getting started`,
      `To join a custom channel for your CS, ECE, or IT class, go to \`#${Constants.Channels.Bot.BotChannel}\`\
      and type \`!register <className_professor>\`\nWhile you are there, try \`!help\` to see what I can do!`,
      false
    );
    embed.addField(
      `Read our Code of Conduct`,
      `Please read our \`#${Constants.Channels.Public.CodeOfConduct}\` and react to the message to show you\
      acknowledge our guidelines, and to gain access to the whole server.`,
      true
    );

    if (!isVerified) {
      embed.addField(
        'You have been unverified in our server',
        'Please post your UCF schedule in `#verify` so one of our Moderators can verify you.',
        true
      );
    }
    return embed;
  }
}
