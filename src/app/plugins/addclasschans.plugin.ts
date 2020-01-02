import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { GuildChannel } from 'discord.js';

interface Channel {
  name: string;
  category: string;
}

export class AddClassChannelsPlugin extends Plugin {
  public name: string = 'Add many classes';
  public description: string = 'creates a bunch of class channels';
  public usage: string = 'addclasschans';
  public permission: ChannelType = ChannelType.Admin;

  private _STATE: Channel[] = [];

  private _CAT_HEADER: RegExp = /^(cs|it)\s*[a-z]*\:?$/;
  private _CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    args = args
      .join('')
      .split('\n')
      .map((v) => {
        return v.toLowerCase().trim();
      })
      .filter((v) => {
        return v.length;
      });

    if (args[0] === 'confirm') {
      this._proceedToAddClasses(message, args);
    } else if (args[0] === 'cancel') {
      this._proceedToCancel(message, args);
    } else {
      this._parseClassListPromptUser(message, args);
    }
  }

  private async _proceedToAddClasses(message: IMessage, args: string[]) {
    if (this._STATE.length === 0) {
      message.reply('No channels to add');
      return;
    }

    const getCat = (category: string) => {
      category = category.toLowerCase();
      const ret = message.guild.channels.find(
        (c) => c.name.toLowerCase() === category && c.type === 'category'
      );
      return ret;
    };

    const mp = new Map<String, GuildChannel>();
    mp.set('cs', getCat('CS-CLASSES'));
    mp.set('it', getCat('IT-CLASSES'));

    for (const chan of this._STATE) {
      // create channel
      message.guild
        .createChannel(chan.name, {
          type: 'text',
          parent: mp.get(chan.category),
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: ['READ_MESSAGE_HISTORY', 'READ_MESSAGES', 'MENTION_EVERYONE'],
              // allow: ['SEND_MESSAGES'],
            },
          ],
        })
        .catch(console.error);
    }

    this._STATE = [];
  }

  private async _proceedToCancel(message: IMessage, args: string[]) {
    message.reply('Job cancelled');
    this._STATE = [];
  }

  private async _parseClassListPromptUser(message: IMessage, args: string[]) {
    const parsedClasses: Channel[] = [];

    let category = 'cs';
    for (const v of args) {
      let match;
      if ((match = this._CAT_HEADER.exec(v))) {
        // change category
        category = match[1];

        continue;
      } else if (v.match(this._CHAN_NAME)) {
        // make new channel
        const newClass: Channel = {
          category,
          name: v,
        };
        parsedClasses.push(newClass);
      } else {
        console.error(`Err: ${v}`);
      }
    }

    const response =
      'making channels:\n```\n' +
      parsedClasses.map((v) => `${v.category}#${v.name}`).join('\n') +
      '\n```\n respond CONFIRM or CANCEL';

    message.reply(response);

    this._STATE = parsedClasses;
  }
}
