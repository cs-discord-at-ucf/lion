import { IHandler, IMessage, IContainer } from '../../common/types';
import Constants from '../../common/constants';
import { TextChannel, Util } from 'discord.js';

export class RequireUrlHandler implements IHandler {
  private _urlRegex: RegExp = /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/;
  private _channels: String[] = [
    Constants.Channels.Public.HelpfulBaubles,
    Constants.Channels.Public.PersonalProjects,
    Constants.Channels.Public.Networking,
  ];

  constructor(public container: IContainer) {}

  public async execute(message: IMessage) {
    const channelObj: TextChannel = this.container.clientService.channels.cache.get(
      message.channel.id
    ) as TextChannel;

    if (!this._channels.includes(channelObj.name)) {
      return;
    }

    if (message.content.toLowerCase().match(this._urlRegex)) {
      return;
    }

    const contents = Util.splitMessage(`Hey ${message.author},\n We require for you to include a link to your message ` +
    `in the #${channelObj.name} channel.\n\n Here's your message content:` +
    `\`\`\`${message.content}\`\`\``, { prepend: '```', append: '```', char: '' });

    contents.forEach(async (content) => {
      await message.author.send({ content })
        .catch((e) => {
          this.container.loggerService.warn(
            `Unable to send message to user ${message.author.username}. Caught exception ${e}`
          );
        });
    });

    await message.delete();
  }
}
