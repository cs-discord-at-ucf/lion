import Bottle from 'bottlejs';
import { TextChannel, Message, GuildMember } from 'discord.js';
import { Container } from '../bootstrap/container';
import { Plugin } from '../common/plugin';
import { ChannelGroup, IContainer, IPlugin } from '../common/types';

export const getTextChannelMock = () =>
  ({
    send: jest.fn(),
  } as unknown as TextChannel);

export const PluginMock = Plugin as jest.Mock<Plugin>;

export const getMessageMock = () =>
  ({
    channel: getTextChannelMock(),
    reply: jest.fn(),
    guild: jest.fn(),
    member: jest.fn(),
  } as unknown as Message);

export const getContainerMock = () => {
  // Mock some services
  const containerBuilder = new Bottle();
  new Container(containerBuilder);
  containerBuilder.resolve({});
  return containerBuilder.container as IContainer;
};

export const getPluginMock = (): IPlugin => ({
  name: 'MockPlugin',
  commandName: 'mock',
  description: 'A mock plugin',
  execute: jest.fn(),
  usage: 'mock',
  isActive: true,
  validate: jest.fn(),
  permission: ChannelGroup.All,
  hasPermission: jest.fn(),
});

export const getMemberMock = (): GuildMember =>
  ({
    displayName: 'MockUser',
  } as unknown as GuildMember);
