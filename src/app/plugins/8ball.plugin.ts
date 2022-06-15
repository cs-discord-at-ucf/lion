// the old usage string was obviously '8ball', although it could be anything moving forward
//
// when executed, lion should respond with an embed containing a message and an embedded image of an 8 ball

import { MessageEmbed } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { getRandom } from '../../common/utils';

const replyOptions = [
  'No.',
  "It's not impossible, but I doubt it.",
  "Don't bet on it.",
  "It's about as likely as your code working on the first try.",
  'Yes.',
  'It is certain.',
  'You can count on it.',
  'I personally guarantee it.',
  'Ask again later.',
];

export default class EightBallPlugin extends Plugin {
  public commandName = '8ball';
  public name = 'Magic Eight Ball';
  public description = 'Get answers from a pseudorandom number generator.';
  public usage = '8ball';
  public permission = ChannelType.All;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage) {
    await message.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(this.name)
          .setThumbnail('https://publicdomainvectors.org/photos/Jarno_8_ball.png')
          .setDescription(getRandom(replyOptions)),
      ],
    });
  }
}
