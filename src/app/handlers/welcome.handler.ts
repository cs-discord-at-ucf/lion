import { GuildMember, RichEmbed, TextChannel } from 'discord.js';
import { IContainer, IHandler, IMessage } from '../../common/types';
import { MemberUtils } from '../util/member.util';
import Constants from '../../common/constants';

export class WelcomeHandler implements IHandler {
  private _LION_URL: string = 'https://github.com/joey-colon/lion';

  constructor(public container: IContainer) {}

  public async execute(member: GuildMember): Promise<void> {
    const shouldUnverify = MemberUtils.shouldUnverify(member);
    const unackChannel = this.container.guildService.getChannel(
      Constants.Channels.Bot.Unacknowledged
    ) as TextChannel;

    const embed = this._createEmbed(shouldUnverify);
    await member.send(embed).catch(async () => {
      //Check if the default embed is in the channel
      await unackChannel.fetchMessages({ limit: 100 }).then(async (messages) => {
        if (!messages.size) {
          return (unackChannel as TextChannel).send(this._createEmbed(true));
        }
      });

      await (unackChannel as TextChannel)
        .send(member.user.toString())
        .then((sentMsg) => (sentMsg as IMessage).delete(1000 * 60 * 60 * 12)); //Delete after 12 hours
    });
  }

  private _createEmbed(shouldUnverfiy: boolean) {
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
