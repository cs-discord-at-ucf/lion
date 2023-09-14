import { MessageEmbed } from 'discord.js';
import { ISlashCommand } from '../../common/slash';

const embed = new MessageEmbed();

const coinImg: string =
  'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/285/coin_1fa99.png';
const wandImg: string =
  'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/magic-wand_1fa84.png';

export default {
  name: 'cointoss',
  commandName: 'cointoss',
  description: 'Ask Lion to toss a coin or if given arguments, choose among the arguments.',
  options: Array.from({ length: 25 }, (_, i) => ({
    name: `outcome${i + 1}`,
    description: `Outcome ${i + 1}`,
    type: 'STRING',
  })),

  async execute({ interaction, container }) {
    const responses: string[] = [];
    const outcomes = Array.from({ length: 25 }, (_, i) =>
      interaction.options.getString(`outcome${i + 1}`)
    ).filter(Boolean) as string[];

    if (outcomes.length === 0) {
      embed.setAuthor({ name: 'Lion flipped a coin and it lands on...', iconURL: coinImg });
      responses.push('Heads', 'Tails');
    } else {
      embed.setAuthor({ name: 'Lion chooses...', iconURL: wandImg });
      responses.push(...outcomes);
    }

    const choice = Math.floor(Math.random() * responses.length);
    embed.setColor('#0099ff').setTitle(responses[choice]);

    await interaction.reply({ embeds: [embed] }).catch(container.loggerService.error);
  },
} satisfies ISlashCommand;
