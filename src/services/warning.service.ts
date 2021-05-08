import { CategoryChannel, GuildChannel, MessageEmbed, Snowflake, TextChannel } from 'discord.js';
import { Maybe } from '../common/types';
import { ClientService } from './client.service';
import { GuildService } from './guild.service';
import { Moderation } from './moderation.service';

export class WarningService {
  private _warnCategory: Maybe<CategoryChannel>;
  private _chanMap = new Map<Snowflake, GuildChannel>();

  constructor(private _clientService: ClientService, private _guildService: GuildService) {}

  public async sendModMessageToUser(message: string, rep: Moderation.Report) {
    await this._clientService.users.cache
      .get(rep.user)
      ?.send(`${message} Reason: ${rep.description || '<none>'}`, {
        files: rep.attachments && JSON.parse(JSON.stringify(rep.attachments)),
      })
      .catch(async () => await this._createChannelForWarn(message, rep));
  }

  private async _createChannelForWarn(message: string, rep: Moderation.Report) {
    if (!this._warnCategory) {
      this._warnCategory = this._guildService.getChannel('warnings') as CategoryChannel;
    }

    const user = this._guildService.get().members.cache.get(rep.user)?.user;
    if (!user) {
      return;
    }

    const warnChan = await this._getChanForUser(rep, this._warnCategory);
    this._chanMap.set(rep.user, warnChan);

    await (warnChan as TextChannel).send(user.toString());
    const embed = await (warnChan as TextChannel).send(this._serializeToEmbed(message, rep));
    await embed.react('👍');
  }

  private async _getChanForUser(rep: Moderation.Report, warnCat: CategoryChannel) {
    if (this._chanMap.has(rep.user)) {
      return this._chanMap.get(rep.user) as GuildChannel;
    }

    return this._guildService.get().channels.create(rep.user, {
      parent: warnCat,
      permissionOverwrites: [
        {
          id: this._guildService.get().id,
          deny: ['VIEW_CHANNEL'],
        },
        {
          id: rep.user,
          allow: ['VIEW_CHANNEL'],
        },
      ],
    });
  }

  private _serializeToEmbed(message: string, rep: Moderation.Report): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle(message);
    embed.addField('Reason', rep.description || '<none>', true);
    embed.setFooter('React to acknowledge this warning');
    embed.attachFiles(rep.attachments && JSON.parse(JSON.stringify(rep.attachments)));
    return embed;
  }

  public async deleteChan(id: Snowflake) {
    await this._chanMap.get(id)?.delete('User acknowledged warning');
    this._chanMap.delete(id);
  }
}