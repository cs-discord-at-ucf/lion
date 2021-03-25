import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { MessageEmbed } from 'discord.js';

class Breed {
  public name: string = '';
  public id: string = '';
}

export class CodePlugin extends Plugin {
  public name: string = 'Code Plugin';
  public description: string =
    'Code shows someones text in code form (only works in same channel). Code how shows how to code';
  public usage: string = 'code <message ID/link (optional)> <lang (optional)>/ code how';
  public pluginAlias = [''];
  public permission: ChannelType = ChannelType.Public;

  private _embedBreeds = new MessageEmbed();

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined) {
      args = [''];
    }

    while (args.length < 2) {
      args.push('');
    }

    const input = args || ['', ''];

    if (input[0] === '' || input[0] === 'how') {
      message.channel.send(
        `You can post in Discord like a real boss by refering to this guide ${Constants.DiscordFormatingInfo}.  The coding in discord information is located under the third header.\n  How to code in discord, speed course edition: \n\'''<language exstension(optional)>\n<Code>\n\'''\nReplace the ' with \``
      );
    } else {
      const messageID = !isNaN(Number(input[0])) ? input[0] : input[0].split('/').pop();

      if (!isNaN(Number(messageID))) {
        message.channel.messages
          .fetch({ around: messageID, limit: 1 })
          .then((targMessage) => {
            message.channel.send(`\`\`\`${input[1]}\n ${targMessage.first()?.content}\n\`\`\``);
          })
          .catch((err) =>
            this.container.loggerService.warn(
              `Failed to find message id ${messageID} in channel <#${messageID}> extra infor if any:\n${err}`
            )
          );
      }
    }
  }
}
