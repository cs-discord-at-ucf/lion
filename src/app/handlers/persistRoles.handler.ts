import { GuildMember, Role, Snowflake } from 'discord.js';
import { IContainer, IHandler, Maybe } from '../../common/types';

export class PersistRolesHandler implements IHandler {
  private _persistedRoles: Record<Snowflake, Role[]> = {};

  constructor(public container: IContainer) {}

  public execute(member: GuildMember) {
    const roles = member.roles.cache;
    this._persistedRoles[member.id] = Array.from(roles.values());
  }

  public getRoles(id: Snowflake): Maybe<Role[]> {
    return this._persistedRoles[id];
  }
}
