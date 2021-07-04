import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { HexColorString, Role, Snowflake } from 'discord.js';

import fs from 'fs';

interface IRoleInfo {
  id: Snowflake;
  name?: string;
  color?: HexColorString;
  remove?: boolean;
}

interface IRoleUpdateResult {
  id?: Snowflake;
  changedName?: boolean;
  changedColor?: boolean;
  removedRole?: boolean;
  oldInfo?: IRoleInfo;
  newInfo?: IRoleInfo;
}

export default class ManageRolesPlugin extends Plugin {
  public commandName: string = 'manageroles';
  public name: string = 'Manage Roles';
  public description: string = 'Manage colors of roles in bulk';
  public usage: string = 'manageroles';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Admin;

  constructor(public container: IContainer) {
    super();
  }

  public validate(_message: IMessage, args: string[]) {
    return args.length > 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const [subCommand] = args;

    switch (subCommand) {
      case 'fetch':
        await this._dumpRolesInfo(message);
        break;
      case 'update':
        await this._updateRoles(message);
        break;
    }
  }

  private async _dumpRolesInfo(message: IMessage) {
    const highestRole = this.container.guildService.get().roles.highest;
    const rolesInfo = this.container.guildService
      .get()
      .roles.cache.reduce((acc: IRoleInfo[], curRole) => {
        // only include roles that the bot can actually update.
        if (curRole.comparePositionTo(highestRole) < 0 && curRole.name !== '@everyone') {
          acc.push(this._makeInfo(curRole));
        }
        return acc;
      }, []);

    const filename = await this._writeDataToFile(rolesInfo);

    message.reply({ content: 'See attached. To update, send back a file with changes.', files: [filename] });
  }

  private async _updateRoles(message: IMessage) {
    const attachments = message.attachments.first();
    if (!attachments) {
      await message.reply('No file supplied.');
      return;
    }

    let roleInfos: IRoleInfo[] = [];
    try {
      const got = await this.container.httpService.get(attachments.url).then((res) => res.data);
      roleInfos = got;
    } catch (ex) {
      await message.reply("Error while parsing supplied role info. Are you sure it's well-formed?");
      this.container.loggerService.warn('Got this error while trying to read ' + attachments.url);
      return;
    }

    const results = await Promise.all(roleInfos.map((r) => this._updateRole(r)));

    message.reply({ content: 'Attached result file.', files: [await this._writeDataToFile(results)] });
  }

  private async _updateRole(roleInfo: IRoleInfo): Promise<IRoleUpdateResult | undefined> {
    try {
      const role = this.container.guildService.get().roles.cache.get(roleInfo.id);

      if (!role) {
        return;
      }

      // save old info in case we want to go back.
      const oldInfo = this._makeInfo(role);

      const changedName = !!(
        roleInfo.name &&
        roleInfo.name !== role.name &&
        (await role.setName(roleInfo.name))
      );
      const changedColor = !!(
        roleInfo.color &&
        roleInfo.color !== role.hexColor &&
        (await role.setColor(roleInfo.color))
      );

      // save newInfo to give result.
      const newInfo = this._makeInfo(role);

      const removedRole = !!(roleInfo.remove && role.delete());
      if (removedRole) {
        newInfo.remove = true;
      }

      return { oldInfo, newInfo, changedName, changedColor, removedRole, id: role.id };
    } catch (ex) {
      this.container.loggerService.error(ex);
    }
  }

  // returns filename
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _writeDataToFile(data: any): Promise<string> {
    const discrim = '' + Math.random();
    const filename = `/tmp/roles_info${discrim}.json`;
    await fs.promises.writeFile(filename, JSON.stringify(data)).catch((err) => {
      this.container.loggerService.error('While writing to ' + filename, err);
    });
    return filename;
  }

  private _makeInfo(role: Role): IRoleInfo {
    return { id: role.id, name: role.name, color: role.hexColor, remove: false };
  }
}
