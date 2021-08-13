import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType } from '../../common/types';
import { GuildChannel, MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';

interface IChannel {
  name: string;
  category: string;
}

export default class AddClassChannelsPlugin extends Plugin {
  public commandName: string = 'addclasschans';
  public name: string = 'Add many classes';
  public description: string = 'creates a bunch of class channels';
  public usage: string = 'addclasschans';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Admin;

  private _STATE: IChannel[] = [];

  private _CATEGORIES: string[] = ['cs', 'it', 'ee', 'csgrad', 'eegrad', 'gened'];
  private _CHAN_NAME: RegExp = /^[a-z]{3}[0-9]{4}[a-z]?.*$/;

  private _NEW_CHAN_MESSAGE =
    'Welcome to the class!\n\n' +
    '**If it has not been done so already, please post the #class_invite ' +
    'to webcourses to have your classmates join you in this channel.**\n\n' +
    '**For TAs**\n'+
    'If you are a TA for this course, reach out to a Moderator to have the ' +
    'TA role added to your user and register as the TA in this channel using ' +
    '`!ta register`. Students in the class can ask the TA a question with a ' +
    'pingable command `!ta ask`.\n\n' +
    '**For Professors**\n'+
    'If you are a professor for this course, reach out to a Moderator to have the ' +
    'Professor role added to your user.\n\n' +
    '**New Create Voice Chat Feature**\n'+
    'You can now create a temporary voice channel for your class by using `!createclassvoice` ' + 
    '(or shorthand `!createvc`) in your class channel. Only people in the channel will be able to '+ 
    'access the temporary channel so you can have private study sessions without the concern of ' + 
    'randos jumping in.\n\n' + 
    '**Need Help?**\n'+
    'In any channel, use `!help` to see what options are available from our bot, Lion. ' +
    'Feel free to reach out to any Moderator with questions or concerns for the server.\n\n' +
    'Have a great semester!'; 

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
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
      await this._proceedToAddClasses(message);
    } else if (args[0] === 'cancel') {
      await this._proceedToCancel(message);
    } else {
      await this._parseClassListPromptUser(message, args);
    }
  }

  private async _proceedToAddClasses(message: IMessage) {
    if (this._STATE.length === 0) {
      await message.reply('No channels to add');
      return;
    }

    const getCat = async (category: string) => {
      category = category.toLowerCase();
      const ret = this.container.guildService
        .get()
        .channels.cache.find((c) => c.name.toLowerCase() === category && c.type === 'category');
      if (!ret) {
        try {
          return await this.container.guildService.get().channels.create(category, {
            type: 'category',
            permissionOverwrites: [
              {
                id: this.container.guildService.get().id,
                deny: ['VIEW_CHANNEL'],
              },
            ],
          });
        } catch (e) {
          this.container.loggerService.error(e);
        }
      }
      return ret;
    };

    const patternToCategory = new Map<String, GuildChannel>();
    for (const k of Object.keys(ClassType)) {
      if (k !== ClassType.ALL) {
        const cat = await getCat(`${k}-classes`);
        if (!cat) {
          continue;
        }
        patternToCategory.set(k.toLowerCase(), cat);
      }
    }

    for (const chan of this._STATE) {
      // create channel
      try {
        await this.container.guildService
          .get()
          .channels.create(chan.name, {
            type: 'text',
            parent: patternToCategory.get(chan.category),
            permissionOverwrites: [
              {
                id: this.container.guildService.get().id,
                deny: ['VIEW_CHANNEL'],
              },
            ],
          })
          .then(async (newChan: GuildChannel) => {
            await (newChan as TextChannel).send(this._createFirstMessage(newChan.name));
          });
      } catch (ex) {
        this.container.loggerService.error(ex);
      }
    }

    this._STATE = [];
  }

  private _createFirstMessage(chanName: string): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(`Welcome to ${chanName}!`);
    embed.setThumbnail(Constants.LionPFP);
    embed.setDescription(this._NEW_CHAN_MESSAGE);
    return embed;
  }

  private async _proceedToCancel(message: IMessage) {
    await message.reply('Job cancelled');
    this._STATE = [];
  }

  private async _parseClassListPromptUser(message: IMessage, args: string[]) {
    const parsedClasses: IChannel[] = [];

    if(!this._CATEGORIES.includes(args[0])) {
      await message.reply('Invalid category');
      return;
    }

    let category = 'cs';
    for (const v of args) {
      let match;
      if ((match = this._CATEGORIES.find((el => el === v)))) {
        // change category
        category = match;
        continue;
      } else if (v.match(this._CHAN_NAME)) {
        // make new channel
        const newClass: IChannel = {
          category,
          name: v.toLowerCase().replace('-', '_'),
        };
        parsedClasses.push(newClass);
      } else {
        this.container.loggerService.error(`Err: ${v}`);
      }
    }

    const response =
      'making channels:\n```\n' +
      parsedClasses.map((v) => `${v.category}#${v.name}`).join('\n') +
      '\n```\n respond CONFIRM or CANCEL';

    await message.reply(response);

    this._STATE = parsedClasses;
  }
}
