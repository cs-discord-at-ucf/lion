import { GuildMember, RichEmbed, Role } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';
import Constants from '../../common/constants';

export class NewMemberHandler implements IHandler {
  private _UNACKNOWLEDGED_ROLE: string = 'Un Acknowledged';
  private _UNVERIFIED_ROLE: string = 'Un verified';
  private _roleCache: Record<string, Maybe<Role>> = {
    [this._UNACKNOWLEDGED_ROLE]: undefined,
    [this._UNVERIFIED_ROLE]: undefined,
  };
  private _LION_URL: string = 'https://github.com/joey-colon/lion';

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    if (!this._roleCache[this._UNACKNOWLEDGED_ROLE]) {
      Object.keys(this._roleCache).forEach((key) => {
        this._roleCache[key] = member.guild.roles.filter((r) => r.name === key).first();
      });
    }

    //Required to remove optional | undefined
    if (!this._roleCache[this._UNACKNOWLEDGED_ROLE]) {
      return;
    }
    member.addRole(<Role>this._roleCache[this._UNACKNOWLEDGED_ROLE]);

    const hasAvatar = Boolean(member.user.avatar);
    if (hasAvatar) {
      this._dmUser(member, false);
      return;
    }

    if (!this._roleCache[this._UNVERIFIED_ROLE]) {
      return;
    }

    member.addRole(<Role>this._roleCache[this._UNVERIFIED_ROLE]);
    this.container.messageService.sendBotReport(
      `User \`${member.user.tag}\` has been automatically unverified`
    );
    this._dmUser(member, true);
  }

  private _dmUser(member: GuildMember, isUnverified: boolean) {
    const embed = this._createEmbed(isUnverified);
    try {
      member.send(embed);
    } catch (e) {}
  }

  private _createEmbed(isUnverified: boolean) {
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

    if (isUnverified) {
      embed.addField(
        'You have been unverified in our server',
        'Please post your UCF schedule in `#verify` so one of our Moderators can verify you.',
        true
      );
    }
    return embed;
  }
}
