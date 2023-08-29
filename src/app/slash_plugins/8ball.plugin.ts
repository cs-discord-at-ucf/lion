// the old usage string was obviously '8ball', although it could be anything moving forward
//
// when executed, lion should respond with an embed containing a message and an embedded image of an 8 ball

import { MessageEmbed } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
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

const plugin: ISlashCommand = {
  name: 'Magic Eight Ball',
  commandName: '8ball',
  description: 'Get answers from a pseudorandom number generator.',
  execute({ interaction }) {
    interaction.reply({ embeds: [createEmbed()] });
  },
};

function createEmbed() {
  return new MessageEmbed()
    .setTitle(plugin.name)
    .setThumbnail('https://publicdomainvectors.org/photos/Jarno_8_ball.png')
    .setDescription(getRandom(replyOptions));
}

export default plugin;
