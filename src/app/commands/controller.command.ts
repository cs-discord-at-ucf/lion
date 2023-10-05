import { MessageEmbed } from 'discord.js';
import levenshtein from 'js-levenshtein';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';
import { IContainer, IRunnable, RunnableTypes } from '../../common/types';

const command = {
  commandName: 'controller',
  name: 'controller',
  description: 'Controls activating and deactivating plugins.',
  defaultMemberPermissions: 'ADMINISTRATOR',
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'list',
      description: 'Lists the statuses of all plugins, jobs, or handlers.',
    },
    {
      type: 'SUB_COMMAND',
      name: 'set',
      description: 'Sets the state of a plugin, job, or handler.',
      options: [
        {
          type: 'STRING',
          name: 'type',
          description: 'The type of runnable to control.',
          required: true,
          choices: [
            {
              name: 'Plugin',
              value: 'plugin',
            },
            {
              name: 'Job',
              value: 'job',
            },
            {
              name: 'Handler',
              value: 'handler',
            },
          ],
        },
        {
          type: 'STRING',
          name: 'name',
          description: 'The name of the runnable to control.',
          required: true,
          autocomplete: true,
        },
        {
          type: 'STRING',
          name: 'state',
          description: 'The state to set the runnable to.',
          required: true,
          choices: [
            {
              name: 'Activate',
              value: 'activate',
            },
            {
              name: 'Deactivate',
              value: 'deactivate',
            },
          ],
        },
      ],
    },
  ],

  autocomplete: async ({ interaction, container }) => {
    const runnables = [];
    const selectedType = interaction.options.getString('type', true);

    if (selectedType === 'plugin') {
      runnables.push(...Object.values(container.pluginService.plugins));
    } else if (selectedType === 'job') {
      runnables.push(...Object.values(container.jobService.jobs));
    } else if (selectedType === 'handler') {
      runnables.push(...container.handlerService.getAllHandlers());
    }

    const focused = interaction.options.getFocused();

    await interaction.respond(
      runnables
        .sort((a, b) => levenshtein(a.name, focused) - levenshtein(b.name, focused))
        .map((r) => ({ name: r.name, value: r.name }))
        .slice(0, 25)
    );
  },

  async execute({ interaction, container }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'list') {
      await interaction.reply({ embeds: getStatuses(container) });
      return;
    }

    const type = interaction.options.getString('type', true);
    const name = interaction.options.getString('name', true).toLowerCase();
    const state = interaction.options.getString('state', true) === 'activate';

    if (type === 'plugin') {
      const result = await setPluginState(name, state, container);
      await interaction.reply(result);
      return;
    }

    if (type === 'job') {
      const result = await setJobState(name, state, container);
      await interaction.reply(result);
      return;
    }

    if (type === 'handler') {
      if (name === 'command') {
        interaction.reply('You cannot turn off the command handler');
        return;
      }

      const result = await setHandlerState(name, state, container);
      await interaction.reply(result);
    }
  },
} satisfies Command;

const setPluginState = async (name: string, state: boolean, container: IContainer) => {
  try {
    await container.pluginService.setPluginState(container, name, state);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return `There was an error setting the state: ${e.message}`;
  }

  return `${name} has been ${state ? 'activated' : 'deactivated'}`;
};

const setJobState = async (name: string, state: boolean, container: IContainer) => {
  try {
    await container.jobService.setJobState(container, name, state);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return `There was an error setting the state: ${e.message}`;
  }

  return `${name} has been ${state ? 'activated' : 'deactivated'}`;
};

const setHandlerState = async (name: string, state: boolean, container: IContainer) => {
  try {
    await container.handlerService.setHandlerState(container, name, state);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return `There was an error setting the state: ${e.message}`;
  }

  return `${name} has been ${state ? 'activated' : 'deactivated'}`;
};

const getStatuses = (container: IContainer) => {
  return [
    listStatusesOfType('plugin', container),
    listStatusesOfType('job', container),
    listStatusesOfType('handler', container),
  ];
};

const listStatusesOfType = (type: RunnableTypes, container: IContainer) => {
  let runnables: IRunnable[] = [];
  if (type === 'plugin') {
    runnables = Object.values(container.pluginService.plugins);
  } else if (type === 'job') {
    runnables = Object.values(container.jobService.jobs);
  } else if (type === 'handler') {
    runnables = container.handlerService.getAllHandlers();
  }

  const inactive = runnables.filter((r) => !r.isActive);

  const embed = new MessageEmbed();
  embed.setTitle('Plugin Statuses');
  embed.setThumbnail(Constants.LionPFP);

  embed.addField(`Number of ${type}s`, `${runnables.length}`, true);
  embed.addField(`Number of inactive ${type}s`, `${inactive.length}`);

  if (inactive.length) {
    embed.addField(`Inactive ${type}s`, inactive.map((p) => p.name).join('\n'), true);
  }

  return embed;
};

export default command;
