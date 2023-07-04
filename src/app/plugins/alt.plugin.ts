import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelGroup } from '../../common/types';
import Constants from '../../common/constants';
import { AltTrackerModel } from '../../schemas/alt.schema';
import { Collection, GuildMember, EmbedBuilder } from 'discord.js';
import { Moderation } from '../../services/moderation.service';

export interface IAltTrackerEntry {
  guildID: string;
  baseID: string;
  knownIDs: string[];
}

export type AltTrackerDocument = IAltTrackerEntry & Document;

export default class AltPlugin extends Plugin {
  public commandName: string = 'alt';
  public name: string = 'Alt Tracker Plugin';
  public description: string = 'Used to link account snowflakes together for reports';
  public usage: string = 'alt add\n<oldID>\n<newID>\n\n' + '!alt list\n<ID>';
  public override pluginAlias = [];
  public permission: ChannelGroup = ChannelGroup.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;

  constructor(public container: IContainer) {
    super();
  }

  public override validate(message: IMessage, args: string[]) {
    const realArgs = args.join(' ').split('\n');
    if (realArgs.length < 2) {
      return false;
    }

    const [subCommand, oldID, newID] = realArgs;

    // There must always be at least one valid ID
    if (!Moderation.Helpers.validateUser(oldID)) {
      return false;
    }

    if (subCommand.toLowerCase() === 'add') {
      // If a second ID was given, make sure its valid
      return !!newID && Moderation.Helpers.validateUser(newID);
    }

    if (subCommand.toLowerCase() === 'list') {
      return realArgs.length === 2;
    }

    // Incorrect subcommand was given
    return false;
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, oldUser, newUser] = args.join(' ').split('\n');

    // Try to resolve firstUser
    const oldMemberID = (
      await Moderation.Helpers.resolveUser(this.container.guildService.get(), oldUser)
    )?.id;

    if (!oldMemberID && !Moderation.Helpers.isID(oldUser)) {
      await message.reply('First user not found');
      return;
    }

    // Add command given
    if (subCommand === 'add') {
      // Try to resolve the second user
      const newMemberID = (
        await Moderation.Helpers.resolveUser(this.container.guildService.get(), newUser)
      )?.id;

      if (!newMemberID && !Moderation.Helpers.isID(newUser)) {
        await message.reply('Second user not found');
        return;
      }

      // Link the 2 IDs in the DB
      const tracker = await this._handleAdd(oldMemberID ?? oldUser, newMemberID ?? newUser);
      const { baseID, knownIDs } = tracker;

      await message.reply({
        embeds: [
          (await this._createAssociationEmbed(baseID, knownIDs))
            .setTitle('Association Created')
            .setDescription(
              `An association between \`${oldUser}\` and \`${newUser}\` has been created.`
            ),
        ],
      });

      return;
    }

    // List command given
    if (subCommand === 'list') {
      const knownIDs = await this.container.modService.getAllKnownAltIDs(
        this.container.guildService.get(),
        oldUser
      );
      await message.reply({
        embeds: [
          (await this._createAssociationEmbed(oldMemberID ?? oldUser, knownIDs))
            .setTitle(`All known IDs for \`${oldUser}\``)
            .setDescription(
              knownIDs.length > 1
                ? `User has \`${knownIDs.length - 1}\` known alt(s)`
                : 'User has no known alts'
            ),
        ],
      });

      return;
    }

    // This shouldn't happen, but leaving here for future subcommands
    await message.reply('Unknown subcommand');
  }

  private async _handleAdd(oldID: string, newID: string) {
    let match = await AltTrackerModel.findOne({
      guildID: this.container.guildService.get().id,
      $or: [{ baseID: oldID }, { baseID: newID }],
    });

    // If this is the first alt, make a new entry
    if (!match) {
      match = await this._createEntry(oldID);
    }

    // Make sure both IDs are in the knownIDs
    // This also prevents duplicate entries
    if (!match.knownIDs.includes(oldID)) {
      match.knownIDs.push(oldID);
    }

    if (!match.knownIDs.includes(newID)) {
      match.knownIDs.push(newID);
    }

    return match.save();
  }

  private async _createEntry(oldID: string) {
    return AltTrackerModel.create({
      guildID: this.container.guildService.get().id,
      baseID: oldID,
      knownIDs: [],
    });
  }

  private async _createAssociationEmbed(baseID: string, knownIDs: string[]) {
    const members = await this.container.guildService.get().members.fetch();

    return new EmbedBuilder()
      .addFields([
        {
          name: 'Base ID',
          value: this._tryToConvertToGuildMember(members, baseID) as string,
        },
        {
          name: 'Known IDs',
          value:
            knownIDs.map((id) => this._tryToConvertToGuildMember(members, id)).join('\n') || 'N/A',
        },
      ])
      .setTimestamp(new Date());
  }

  private _tryToConvertToGuildMember(
    members: Collection<string, GuildMember>,
    id: string
  ): GuildMember | string {
    const member = members.get(id);
    if (member) {
      return member;
    }

    return id;
  }
}
