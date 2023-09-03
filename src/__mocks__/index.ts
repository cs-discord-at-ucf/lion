import Bottle from 'bottlejs';
import { TextChannel, Message, GuildMember } from 'discord.js';
import { Container } from '../bootstrap/container';
import { ChannelType, IContainer, IPlugin } from '../common/types';
import { vi } from 'vitest';

export const getTextChannelMock = () =>
  ({
    send: vi.fn(),
  } as unknown as TextChannel);

export const getMessageMock = () =>
  ({
    channel: getTextChannelMock(),
    reply: vi.fn(),
    guild: vi.fn(),
    member: vi.fn(),
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
  execute: vi.fn(),
  usage: 'mock',
  isActive: true,
  validate: vi.fn(),
  permission: ChannelType.All,
  hasPermission: vi.fn(),
});

export const getMemberMock = (): GuildMember =>
  ({
    displayName: 'MockUser',
  } as unknown as GuildMember);
