import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { Role, Snowflake } from 'discord.js';

interface RoleInfo {
  id: Snowflake;
  name?: string;
  color?: string;
  remove?: boolean;
}

interface RoleUpdateResult {
  id?: Snowflake;
  changedName?: boolean;
  changedColor?: boolean;
  removedRole?: boolean;
  oldInfo?: RoleInfo;
  newInfo?: RoleInfo;
}

export class ManageRolesPlugin extends Plugin {
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
    const [subCommand, ...rest] = args;

    switch (subCommand) {
      case 'fetch':
        await this._dumpRolesInfo(message);
        break;
      case 'update':
        await this._updateRoles(message, rest.join('\n'));
        break;
    }
  }

  private async _dumpRolesInfo(message: IMessage) {
    const { highestRole } = message.guild.me;
    const rolesInfo = message.guild.roles.reduce((acc: RoleInfo[], curRole) => {
      // only include roles that the bot can actually update.
      if (curRole.comparePositionTo(highestRole) < 0 && curRole.name !== '@everyone') {
        acc.push(this._makeInfo(curRole));
      }
      return acc;
    }, []);

    message.reply(`Info:\n\`\`\`\n${JSON.stringify(rolesInfo)}\n\`\`\``);
  }

  private async _updateRoles(message: IMessage, info: string) {
    let roleInfos: RoleInfo[] = [];
    try {
      roleInfos = JSON.parse(info);
    } catch (ex) {
      message.reply("Error while parsing supplied role info. Are you sure it's well-formed?");
      return;
    }

    const results = await Promise.all(roleInfos.map((r) => this._updateRole(r)));

    message.reply(`Result:\n\`\`\`\n${JSON.stringify(results)}\n\`\`\``);
  }

  private async _updateRole(roleInfo: RoleInfo): Promise<RoleUpdateResult | undefined> {
    try {
      const role = this.container.guildService.get().roles.get(roleInfo.id);

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

      const removedRole = !!(roleInfo.remove && role?.delete());
      if (removedRole) {
        newInfo.remove = true;
      }

      return { oldInfo, newInfo, changedName, changedColor, removedRole, id: role.id };
    } catch (ex) {
      this.container.loggerService.error(ex);
    }
  }

  private _makeInfo(role: Role): RoleInfo {
    return { id: role.id, name: role.name, color: role.hexColor, remove: false };
  }
}
