import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export class CodePlugin extends Plugin {
  public name: string = 'Code Plugin';
  public description: string =
    'Shows someones text in code form (it only works in the channel the command was called in). "Code how" posts a link with formatting help and a quick discord message coding explanation.';
  public usage: string = 'code <message ID/link (optional)> <lang (optional)>/ code how';
  public pluginAlias = [''];
  public permission: ChannelType = ChannelType.Public;

  private discordFormatingInfo: string =
    'https://cdn.discordapp.com/avatars/574623716638720000/7d404c72a6fccb4a3bc610490f8d7b72.png';
  private formattingMessage: string =
    `You can post in Discord like a real boss by refering to this guide ${this.discordFormatingInfo}.  The coding in discord information is located under the third header.\n` +
    `>>> How to code in discord, speed course edition: \n` +
    `\'''<language exstension(optional)>` +
    `\n<Code>\n` +
    `\'''\n` +
    `Replace the ' with \``;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const input = args || ['how'];

    if (input[0] === '' || input[0] === 'how') {
      message.channel.send(this.formattingMessage);
    } else {
      const messageID = this.isNumeric(input[0]) ? input[0] : input[0].split('/').pop();

      if (this.isNumeric(messageID)) {
        message.channel.messages
          .fetch({ around: messageID, limit: 1 })
          .then((targMessage) => {
            message.channel.send(
              `\`\`\`${input[1] || ''}\n ${targMessage.first()?.content}\n\`\`\``
            );
          })
          .catch((err) =>
            this.container.loggerService.warn(
              `Failed to find message id ${messageID} in channel <#${messageID}> extra infor if any:\n${err}`
            )
          );
      }
    }
  }

  private isNumeric(possibleNumber: any): Boolean {
    return !isNaN(Number(possibleNumber));
  }
}
