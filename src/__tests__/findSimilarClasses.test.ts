import { describe, test, expect } from 'vitest';
import { ClassService } from '../services/class.service';
import { LoggerService } from '../services/logger.service';
import { GuildService } from '../services/guild.service';
import { MessageService } from '../services/message.service';

const sampleClasses = [
  'cot4593_umar',
  'cot4593_zaid',
  'cot2444_bradford',
  'cot4593h_silicatony',
  'cap4453_norman',
  'cap4453_khan',
  'cap3223_spectre',
  'cap3223_umar'
];

const root_id = 3333, category_id = 9999;

const createChannel = (name: string, parentId: number) => (
  { isThread: () => false, name, parentId }
);

const channelMap = new Map<number, ReturnType<typeof createChannel>>();
sampleClasses.map((name, idx) => channelMap.set(idx, createChannel(name, category_id)));
channelMap.set(category_id, createChannel('cs-classes', root_id));

const fakeGuildService = {
  get: () => ({ channels: { cache: channelMap } }),
  getChannel: () => ({ children: [] })
} as unknown as GuildService;

const classService = new ClassService(fakeGuildService,
  null as unknown as LoggerService,
  null as unknown as MessageService
);

describe('ClassService.findSimilarClasses', () => {
  test('Entering a prefix', () => {
    expect(classService.findSimilarClasses('cot')).toEqual([
      'cot4593_umar',
      'cot4593_zaid',
      'cot2444_bradford',
      'cot4593h_silicatony'
    ]);

    expect(classService.findSimilarClasses('cap')).toEqual([
      'cap4453_norman',
      'cap4453_khan',
      'cap3223_spectre',
      'cap3223_umar'
    ]);
  });

  test('Entering a code', () => {
    expect(classService.findSimilarClasses('4593')).toEqual([
      'cot4593_umar',
      'cot4593_zaid',
      'cot4593h_silicatony'
    ]);

    expect(classService.findSimilarClasses('4593h')).toEqual([
      'cot4593h_silicatony'
    ]);

    expect(classService.findSimilarClasses('3223')).toEqual([
      'cap3223_spectre',
      'cap3223_umar'
    ]);
  });

  test('Entering a professor name', () => {
    expect(classService.findSimilarClasses('umar')).toEqual([
      'cot4593_umar',
      'cap3223_umar'
    ]);

    expect(classService.findSimilarClasses('bradford')).toEqual([
      'cot2444_bradford'
    ]);
  });

  test('Other inputs', () => {
    expect(classService.findSimilarClasses('cap4453')).toEqual([
      'cap4453_norman',
      'cap4453_khan'
    ]);

    expect(classService.findSimilarClasses('cot4593_zaid')).toEqual([
      'cot4593_zaid'
    ]);
  });
});
