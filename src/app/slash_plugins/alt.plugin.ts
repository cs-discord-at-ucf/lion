import { Formatters, MessageEmbed } from 'discord.js';
import { Command } from '../../common/slash';
import { IContainer } from '../../common/types';
import { AltTrackerModel } from '../../schemas/alt.schema';

export interface IAltTrackerEntry {
  guildID: string;
  baseID: string;
  knownIDs: string[];
}

export type AltTrackerDocument = IAltTrackerEntry & Document;

async function createEntry(container: IContainer, oldId: string) {
  return AltTrackerModel.create({
    guildID: container.guildService.get().id,
    baseID: oldId,
    knownIDs: [],
  });
}

async function addAlt(container: IContainer, oldId: string, newId: string) {
  let match = await AltTrackerModel.findOne({
    guildID: container.guildService.get().id,
    $or: [{ baseID: oldId }, { baseID: newId }],
  });

  // If this is the first alt, make a new entry
  if (!match) {
    match = await createEntry(container, oldId);
  }

  // Make sure both IDs are in the knownIDs
  // This also prevents duplicate entries
  if (!match?.knownIDs.includes(oldId)) {
    match?.knownIDs.push(oldId);
  }

  if (!match?.knownIDs.includes(newId)) {
    match?.knownIDs.push(newId);
  }

  return match?.save();
}

function createAssociationEmbed(baseId: string, knownIds: string[]) {
  return new MessageEmbed()
    .addField('Base ID', `${Formatters.userMention(baseId)} - \`${baseId}\``)
    .addField(
      'Known IDs',
      knownIds.map((id) => `${Formatters.userMention(id)} - \`${id}\``).join('\n') || 'N/A'
    )
    .setTimestamp(new Date());
}

export default {
  name: 'alt',
  commandName: 'alt',
  description: 'A plugin that links accounts together for reports.',
  defaultMemberPermissions: ['MODERATE_MEMBERS'],
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'add',
      description: 'Add a new alt to the database.',
      options: [
        {
          name: 'old_id',
          description: 'The old ID to link.',
          type: 'USER',
          required: true,
        },
        {
          name: 'new_id',
          description: 'The new ID to link.',
          type: 'USER',
          required: true,
        },
      ],
    },
    {
      type: 'SUB_COMMAND',
      name: 'list',
      description: 'List all alts of a user.',
      options: [
        {
          name: 'user',
          description: 'The ID to list alts for.',
          type: 'USER',
          required: true,
        },
      ],
    },
  ],

  async execute({ interaction, container }) {
    await interaction.deferReply();
    const subCommand = interaction.options.getSubcommand(true) as 'add' | 'list';

    if (subCommand === 'add') {
      const oldUser = interaction.options.getUser('old_id', true);
      const newUser = interaction.options.getUser('new_id', true);
      const { baseID, knownIDs } = await addAlt(container, oldUser.id, newUser.id);
      await interaction.followUp({
        embeds: [
          createAssociationEmbed(baseID, knownIDs)
            .setTitle('Association Created')
            .setDescription(`An association between ${oldUser} and ${newUser} has been created.`),
        ],
      });
      return;
    }

    if (subCommand === 'list') {
      const user = interaction.options.getUser('user', true);
      const knownIDs = await container.modService.getAllKnownAltIDs(
        container.guildService.get(),
        user.id
      );

      await interaction.followUp({
        embeds: [
          createAssociationEmbed(user.id, knownIDs)
            .setTitle(`All known IDs for ${user.id}`)
            .setDescription(
              knownIDs.length > 1
                ? `User has \`${knownIDs.length - 1}\` known alt(s)`
                : 'User has no known alts'
            ),
        ],
      });

      return;
    }
  },
} satisfies Command;
