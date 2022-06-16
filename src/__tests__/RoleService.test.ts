import { GuildMember } from 'discord.js';
import { RoleType, RoleTypeKey } from '../common/types';
import { RoleService } from '../services/role.service';

const createGuildMember = (...roles: RoleTypeKey[]): GuildMember => {
  return {
    roles: {
      cache: roles.map((role) => ({ name: role })),
    },
  } as unknown as GuildMember;
};

describe('RoleService.hasPermission()', () => {
  test('admin has permission to do admin things', () => {
    expect(new RoleService().hasPermission(createGuildMember('Admin'), RoleType.Admin)).toBe(true);
  });

  test("regular user can't do admin things", () => {
    expect(new RoleService().hasPermission(createGuildMember('RegularUser'), RoleType.Admin)).toBe(
      false
    );
  });

  test("regular user can't do moderator things", () => {
    expect(
      new RoleService().hasPermission(createGuildMember('RegularUser'), RoleType.Moderator)
    ).toBe(false);
  });

  test("moderator can't do admin things", () => {
    expect(new RoleService().hasPermission(createGuildMember('Moderator'), RoleType.Admin)).toBe(
      false
    );
  });

  test('moderator can do regular things', () => {
    expect(
      new RoleService().hasPermission(createGuildMember('Moderator'), RoleType.RegularUser)
    ).toBe(true);
  });

  test('suspended admin can do admin and mod things', () => {
    expect(
      new RoleService().hasPermission(createGuildMember('Admin', 'Suspended'), RoleType.Admin)
    ).toBe(true);
    expect(
      new RoleService().hasPermission(createGuildMember('Admin', 'Suspended'), RoleType.Moderator)
    ).toBe(true);
  });

  test('suspended moderator user can do mod things', () => {
    expect(
      new RoleService().hasPermission(
        createGuildMember('Moderator', 'Suspended'),
        RoleType.Moderator
      )
    ).toBe(true);
  });

  test("suspended regular user can't do things", () => {
    expect(
      new RoleService().hasPermission(
        createGuildMember('RegularUser', 'Suspended'),
        RoleType.RegularUser
      )
    ).toBe(false);
  });
});
