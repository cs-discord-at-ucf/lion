import { vi, beforeAll, test, describe, expect } from 'vitest';
import { getContainerMock, getMessageMock, getTextChannelMock } from '../__mocks__';

vi.mock('discord.js', async (importOriginal) => {
  const module: typeof import('discord.js') = await importOriginal();

  const Client = module.Client;

  Client.prototype.login = vi.fn();
  Client.prototype.guilds = {
    cache: {
      // @ts-expect-error overloaded
      first() {
        return {
          name: 'guild',
          id: '123456789',
        };
      },
    },
  };

  return {
    ...module,
    Client,
  };
});

vi.mock('../services/message.service', () => {
  const MessageService = vi.fn();

  MessageService.prototype._getBotChannel = () => getTextChannelMock();
  MessageService.prototype.getChannel = () => getTextChannelMock();

  return { MessageService };
});

import { CommandHandler } from '../app/handlers/command.handler';
import { Plugin } from '../common/plugin';
import { IContainer, ChannelType, IMessage, Voidable } from '../common/types';

const container = getContainerMock();
class MockPlugin extends Plugin {
  public container: IContainer = container;
  public commandName: string = 'mock';
  public name: string = 'mock';
  public description: string = 'A mock Plugin';
  public usage: string = 'mock';
  public permission: ChannelType = ChannelType.Public;

  public execute(message: IMessage): Voidable {
    message.reply('hello');
  }
}

const plugin = new MockPlugin();
const mockMessage = getMessageMock();

mockMessage.content = '!mock';
const commandHandler = new CommandHandler(container);

beforeAll(() => {
  container.pluginService.register(plugin);
});

describe('Plugin Architecture', () => {
  test('Command to fetch proper plugin', () => {
    expect(commandHandler.build(mockMessage.content)).toBeTruthy();
  });

  test('Expect plugin to be executed.', async () => {
    const spy = vi.spyOn(plugin, 'execute');
    await plugin.execute(mockMessage);
    expect(spy).toBeCalled();
  });

  test('Plugin with same name to fail', () => {
    expect(() => container.pluginService.register(plugin)).toThrow();
  });
});
