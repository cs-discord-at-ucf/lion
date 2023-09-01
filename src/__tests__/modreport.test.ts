import ModReportPlugin from '../app/plugins/modreport.plugin';
import { Moderation } from '../services/moderation.service';
import { getContainerMock } from '../__mocks__';
import { describe, test, expect } from 'vitest';

describe('Modreport Arg Tests', () => {
  test('Name with no spaces', () => {
    const plugin = new ModReportPlugin(getContainerMock());

    const input = 'warn Tanndlin#4450 Being bad';

    const parsed = plugin.parseArgs(input.split(' '));
    expect(parsed).toBeTruthy(); // Not null

    const {
      subCommand,
      givenHandle: userHandle,
      description,
    } = parsed as Moderation.IModReportRequest;

    expect(subCommand).toEqual('warn');
    expect(userHandle).toEqual('Tanndlin#4450');
    expect(description).toEqual('Being bad');
  });

  test('Name with spaces', () => {
    const plugin = new ModReportPlugin(getContainerMock());

    const input = 'list Tanndlin Test#6270 Too rowdy :(';

    const parsed = plugin.parseArgs(input.split(' '));
    expect(parsed).toBeTruthy(); // Not null

    const { subCommand, givenHandle, description } = parsed as Moderation.IModReportRequest;

    expect(subCommand).toEqual('list');
    expect(givenHandle).toEqual('Tanndlin Test#6270');
    expect(description).toEqual('Too rowdy :(');
  });

  test('ID as handle', () => {
    const plugin = new ModReportPlugin(getContainerMock());

    const input = 'add 97478270424985600 bruh';

    const parsed = plugin.parseArgs(input.split(' '));
    expect(parsed).toBeTruthy(); // Not null

    const { subCommand, givenHandle, description } = parsed as Moderation.IModReportRequest;

    expect(subCommand).toEqual('add');
    expect(givenHandle).toEqual('97478270424985600');
    expect(description).toEqual('bruh');
  });
});
