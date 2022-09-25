import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, ClassType, RoleType } from '../../common/types';
import { CategoryChannel, GuildChannel, MessageEmbed, TextChannel, Util } from 'discord.js';
import Constants from '../../common/constants';

interface IChannel {
  code: string;
  category: string;
  name?: string;
}

export default class AddClassChannelsPlugin extends Plugin {
  public commandName: string = 'addclasschans';
  public name: string = 'Add many classes';
  public description: string = 'creates a bunch of class channels';
  public usage: string = 'addclasschans';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override minRoleToRun: RoleType = RoleType.Admin;

  private _STATE: IChannel[] = [];
  private _CATEGORIES: string[] = ['cs', 'it', 'ee', 'csgrad', 'eegrad', 'gened'];

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
    return args && args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const [category, ...classes] = args.join(' ').split('\n');
    const catName = category.toLowerCase();
    const parsedClasses: IChannel[] = classes.map((c) => {
      const [code, ...name] = c.split(' ');
      return { code: code.toLowerCase(), category: catName, name: name.join(' ') };
    });

    if (args[0] === 'confirm') {
      await this._proceedToAddClasses(message);
    } else if (args[0] === 'cancel') {
      await this._proceedToCancel(message);
    } else {
      await this._promptUser(message, parsedClasses);
    }
  }

  private _getNewChanMessage(id: String): string {
    return 'Welcome to the class!\n\n' +
    `**If it has not been done so already, please post the <#${id}> ` +
    'to webcourses to have your classmates join you in this channel.**\n\n' +
    '**For TAs**\n' +
    'If you are a TA for this course, reach out to a Moderator to have the ' +
    'TA role added to your user and register as the TA in this channel using ' +
    '`!ta register`. Students in the class can ask the TA a question with a ' +
    'pingable command `!ta ask`.\n\n' +
    '**For Professors**\n' +
    'If you are a professor for this course, reach out to a Moderator to have the ' +
    'Professor role added to your user.\n\n' +
    '**New Create Voice Chat Feature**\n' +
    'You can now create a temporary voice channel for your class by using `!createclassvoice` ' +
    '(or shorthand `!createvc`) in your class channel. Only people in the channel will be able to ' +
    'access the temporary channel so you can have private study sessions without the concern of ' +
    'randos jumping in.\n\n' +
    '**Need Help?**\n' +
    'In any channel, use `!help` to see what options are available from our bot, Lion. ' +
    'Feel free to reach out to any Moderator with questions or concerns for the server.\n\n' +
    'Have a great semester!';
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
        .channels.cache.find(
          (c) => c.name.toLowerCase() === category && c.type === 'GUILD_CATEGORY'
        );
      if (!ret) {
        try {
          return await this.container.guildService.get().channels.create(category, {
            type: 'GUILD_CATEGORY',
            permissionOverwrites: [
              {
                id: this.container.guildService.get().id,
                deny: ['VIEW_CHANNEL'],
              },
            ],
          });
        } catch (e) {
          this.container.loggerService.error(`_proceedToAddClasses: ${e}`);
        }
      }
      return ret;
    };

    const patternToCategory = new Map<String, CategoryChannel>();
    for (const k of Object.keys(ClassType)) {
      if (k !== ClassType.ALL) {
        const cat = await getCat(`${k}-classes`);
        if (!cat) {
          continue;
        }
        patternToCategory.set(k.toLowerCase(), cat as CategoryChannel);
      }
    }

    for (const chan of this._STATE) {
      // create channel
      try {
        await this.container.guildService
          .get()
          .channels.create(chan.code, {
            type: 'GUILD_TEXT',
            parent: patternToCategory.get(chan.category),
            topic: chan.name,
            permissionOverwrites: [
              {
                id: this.container.guildService.get().id,
                deny: ['VIEW_CHANNEL'],
              },
            ],
          })
          .then(async (newChan: GuildChannel) => {
            await (newChan as TextChannel).send({
              embeds: [await this._createFirstMessage(newChan.name)],
            });
          });
      } catch (e) {
        this.container.loggerService.error(`_proceedToAddClasses: ${e}`);
      }
    }

    this._STATE = [];
  }

  private async _createFirstMessage(chanName: string): Promise<MessageEmbed> {
    const getInvChan = async () => {
      let ret;
      ret = this.container.guildService
        .get()
        .channels.cache.find((c) => c.name === Constants.Channels.Info.ClassInvite);
      if (!ret) {
        ret = (await this.container.guildService
          .get()
          .channels.fetch())
          .find((c) => c.name === Constants.Channels.Info.ClassInvite);
      }
      return ret;
    };

    const invChan = await getInvChan();
    const embed = new MessageEmbed();
    embed.setTitle(`Welcome to ${chanName}!`);
    embed.setThumbnail(Constants.LionPFP);
    embed.setDescription(
      this._getNewChanMessage(invChan!.id)
    );
    return embed;
  }

  private async _proceedToCancel(message: IMessage) {
    await message.reply('Job cancelled');
    this._STATE = [];
  }

  private async _promptUser(message: IMessage, classes: IChannel[]) {
    if (!this._CATEGORIES.includes(classes[0].category)) {
      await message.reply('Invalid category');
      return;
    }

    const response =
      'making channels:\n```\n' +
      classes.map((v) => `${v.category}#${v.code} -- ${v.name}`).join('\n') +
      '\n```\n respond CONFIRM or CANCEL';

    const messages = Util.splitMessage(response, { char: '\n', prepend: '```', append: '```' });
    await Promise.all(messages.map((m) => message.channel.send({ content: m })));
    this._STATE = classes;
  }
}
