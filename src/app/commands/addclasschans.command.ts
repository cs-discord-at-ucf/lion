import {
  ButtonInteraction,
  CategoryChannel,
  CommandInteraction,
  GuildChannel,
  MessageEmbed,
  TextChannel,
  Util,
} from 'discord.js';
import Constants from '../../common/constants';
import { ISlashCommand } from '../../common/slash';
import { ClassType, IContainer } from '../../common/types';
import { createConfirmationReply } from '../../common/utils';

interface IChannel {
  code: string;
  category: string;
  name?: string;
}

const command = {
  commandName: 'addclasschans',
  name: 'Add many classes',
  description: 'creates a bunch of class channels',
  defaultMemberPermissions: 'ADMINISTRATOR',
  options: [
    {
      name: 'category',
      description: 'The category of the class',
      type: 'STRING',
      required: true,
      choices: Object.values(ClassType).map((c) => ({ name: c, value: c })),
    },
    {
      name: 'classes',
      description: 'The classes to add',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const category = interaction.options.getString('category');
    if (!category) {
      await interaction.reply('Invalid category');
      return;
    }

    const classes = interaction.options.getString('classes');
    if (!classes) {
      await interaction.reply('Invalid classes');
      return;
    }

    const catName = category.toLowerCase();
    const parsedClasses: IChannel[] = classes.split(',').map((c) => {
      const [code, ...name] = c.split(' ');
      return { code: code.toLowerCase(), category: catName, name: name.join(' ') };
    });

    await promptUser(interaction, container, parsedClasses);
  },
} satisfies ISlashCommand;

const getNewChanMessage = (container: IContainer): string => {
  const id = container.guildService.getChannel(Constants.Channels.Info.ClassInvite).id;

  return (
    'Welcome to the class!\n\n' +
    `**If it has not been done so already, please post the <#${id}> ` +
    'to webcourses to have your classmates join you in this channel.**\n\n' +
    '**For TAs**\n' +
    'If you are a TA for this course, reach out to a Moderator to have the ' +
    'TA role added to your user and register as the TA in this channel using ' +
    '`/ta register`. Students in the class can ask the TA a question with a ' +
    'pingable command `/ta ask`.\n\n' +
    '**For Professors**\n' +
    'If you are a professor for this course, reach out to a Moderator to have the ' +
    'Professor role added to your user.\n\n' +
    '**New Create Voice Chat Feature**\n' +
    'You can now create a temporary voice channel for your class by using `/createclassvoice` ' +
    'in your class channel. Only people in the channel will be able to ' +
    'access the temporary channel so you can have private study sessions without the concern of ' +
    'randos jumping in.\n\n' +
    '**Need Help?**\n' +
    'Feel free to reach out to any Moderator with questions or concerns for the server.\n\n' +
    'Have a great semester!'
  );
};

const proceedToAddClasses = async (container: IContainer, channels: IChannel[]) => {
  const getCat = async (category: string) => {
    category = category.toLowerCase();
    const ret = container.guildService
      .get()
      .channels.cache.find((c) => c.name.toLowerCase() === category && c.type === 'GUILD_CATEGORY');
    if (!ret) {
      try {
        return await container.guildService.get().channels.create(category, {
          type: 'GUILD_CATEGORY',
          permissionOverwrites: [
            {
              id: container.guildService.get().id,
              deny: ['VIEW_CHANNEL'],
            },
          ],
        });
      } catch (e) {
        container.loggerService.error(`_proceedToAddClasses: ${e}`);
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

  const failedChannels = [];
  for (const chan of channels) {
    // create channel
    try {
      await container.guildService
        .get()
        .channels.create(chan.code, {
          type: 'GUILD_TEXT',
          parent: patternToCategory.get(chan.category),
          topic: chan.name,
          permissionOverwrites: [
            {
              id: container.guildService.get().id,
              deny: ['VIEW_CHANNEL'],
            },
          ],
        })
        .then(async (newChan: GuildChannel) => {
          await (newChan as TextChannel).send({
            embeds: [createFirstMessage(newChan.name, container)],
          });
        });
    } catch (e) {
      container.loggerService.error(`_proceedToAddClasses: ${JSON.stringify(e)}`);
      failedChannels.push(chan);
    }
  }

  return failedChannels;
};

const createFirstMessage = (chanName: string, container: IContainer): MessageEmbed => {
  return new MessageEmbed()
    .setTitle(`Welcome to ${chanName}!`)
    .setThumbnail(Constants.LionPFP)
    .setDescription(getNewChanMessage(container));
};

const promptUser = async (
  interaction: CommandInteraction,
  container: IContainer,
  classes: IChannel[]
) => {
  const response =
    'making channels:\n```\n' +
    classes.map((v) => `${v.category}#${v.code} -- ${v.name}`).join('\n') +
    '\n```';

  const messages = Util.splitMessage(response, { char: '\n', prepend: '```', append: '```' });
  await Promise.all(messages.map((m) => interaction.channel?.send({ content: m })));

  const onConfirm = async (btnInteraction: ButtonInteraction) => {
    await btnInteraction.followUp('Creating channels...');
    const failedClasses = await proceedToAddClasses(container, classes);

    await btnInteraction.followUp('Done');
    if (failedClasses.length) {
      await btnInteraction.followUp(`Failed to create some channels: ${failedClasses.join(', ')}`)
    }
  };

  await createConfirmationReply(interaction, {
    payload: {
      content: `Are you sure you want to create these **${classes.length}** channels?`,
    },
    onConfirm,
  });
};

export default command;
