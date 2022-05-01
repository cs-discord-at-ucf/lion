import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import Constants from '../../common/constants';
import { AltTrackerModel } from '../../schemas/alt.schema';
import { MessageEmbed } from 'discord.js';

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
  public usage: string = 'alt add <old> <new>';
  public override pluginAlias = [];
  public permission: ChannelType = ChannelType.Staff;
  public override pluginChannelName: string = Constants.Channels.Staff.ModCommands;
  public override commandPattern: RegExp = /add \d{17,18} \d{17,18}/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand, oldID, newID] = args;

    if (subCommand === 'add') {
      const tracker = await this._handleAdd(oldID, newID);
      const { baseID, knownIDs } = tracker;

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setTitle('Association Created')
            .setDescription(
              `An association between \`${oldID}\` and \`${newID}\` has been created.`
            )
            .addField('Base ID', baseID)
            .addField('Known IDs', knownIDs.join('\n') || 'N/A')
            .setTimestamp(new Date()),
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
}
