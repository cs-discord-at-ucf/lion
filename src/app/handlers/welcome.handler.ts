import { GuildMember, RichEmbed, TextChannel } from 'discord.js';
import { IContainer, IHandler, Maybe, IMessage } from '../../common/types';
import Constants from '../../common/constants';

export class WelcomeHandler implements IHandler {
  private _LION_URL: string = 'https://github.com/joey-colon/lion';
  private _UNACKNOWLEDGED_CHANNEL: Maybe<TextChannel> = null;

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const hasAvatar = Boolean(member.user.avatar);
    const embed = this._createEmbed(hasAvatar);
    await member.send(embed).catch(() => {
      if (!this._UNACKNOWLEDGED_CHANNEL) {
        this._UNACKNOWLEDGED_CHANNEL = this.container.guildService
          .get()
          .channels.filter((chan) => chan.name === Constants.Channels.Bot.Unacknowledged)
          .first() as TextChannel;
      }

      //Check if the default embed is in the channel
      this._UNACKNOWLEDGED_CHANNEL.fetchMessages({ limit: 100 }).then((messages) => {
        if (!messages.size) {
          (this._UNACKNOWLEDGED_CHANNEL as TextChannel).send(this._createEmbed(true));
        }

        //Do this inside the then, to make sure it fetchMessages doesn't fetch the mention
        (this._UNACKNOWLEDGED_CHANNEL as TextChannel)
          .send(member.user.toString())
          .then((sentMsg) => (sentMsg as IMessage).delete(1000 * 10)); //Delete after 10 seconds
      });
    });
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
        'You have been marked as unverified in our server',
        'Please post your UCF schedule in `#verify` so one of our Moderators can verify you.',
        true
      );
    }
    return embed;
  }
}
