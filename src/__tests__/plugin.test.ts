jest.mock('discord.js', () => {
    return {
      ...jest.requireActual('discord.js'),
      Client: jest.fn().mockImplementation(() => {
        return { 
          login: jest.fn(),
          guilds: {
            cache: {
              first: () => [{
                name: 'guild',
                id: '123456789',
              }]
            },
            channels: {
              cache: [getTextChannelMock()]
            }
          }
        };
      }),
    };
});

jest.mock('../services/message.service', () => {
  return {
    MessageService: jest.fn().mockImplementation(() => {
      return { 
          _getBotChannel: () => getTextChannelMock(),
          getChannel: () => getTextChannelMock(),
         };
    })
  };
});

import { CommandHandler } from '../app/handlers/command.handler';
import { Plugin } from '../common/plugin';
import { IContainer, ChannelType, IMessage, Voidable } from '../common/types';
import { getContainerMock, getMessageMock, getTextChannelMock } from '../__mocks__';

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
    const spy = jest.spyOn(plugin, 'execute');
    await plugin.execute(mockMessage);
    expect(spy).toBeCalled();
  });

  test('Plugin with same name', () => {
    expect(() => container.pluginService.register(plugin)).toThrow();
  });

  test('Has proper permission', async () => {
    const mockChannel = getTextChannelMock();
    mockChannel.name = 'general';
    mockMessage.channel = mockChannel;

    const spy = jest.spyOn(plugin, 'hasPermission');

    await commandHandler.execute(mockMessage);
    expect(spy).toReturnWith(false);
  });
});
