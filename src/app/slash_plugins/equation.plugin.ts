import axios from 'axios';
import { MessageAttachment } from 'discord.js';
import { Command } from '../../common/slash';

const BASE_URL = 'https://chart.googleapis.com/chart';

export default {
  name: 'equation',
  commandName: 'equation',
  description: 'A plugin that generated equations given a tex string.',
  options: [
    {
      name: 'equation',
      description: 'The equation to generate.',
      type: 'STRING',
      required: true,
    },
  ],
  async execute({ interaction }) {
    await interaction.deferReply();
    const equation = interaction.options.getString('equation', true);

    // Define the properties of the image.
    const params = {
      cht: 'tx',
      chl: equation,
      chs: 40,
      chf: 'bg,s,00000000',
      chco: 'FFFFFF',
    };

    // Fetch result. (Can't use container.httpServer because it doesn't allow options.)
    let result;
    try {
      result = await axios.get(BASE_URL, {
        params,
        responseType: 'arraybuffer',
      });
    } catch (err) {
      interaction.followUp(
        'There was an error generating an equation, did you enter your equation properly?'
      );
      return;
    }

    // Capture buffer.
    const buffer = Buffer.from(result.data, 'base64');

    // Create attachment.
    const attachment = new MessageAttachment(buffer, 'equation.png');

    // Send message.
    await interaction.followUp({ files: [attachment] });
  },
} satisfies Command;
