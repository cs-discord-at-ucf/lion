import { TextChannel } from 'discord.js';
import ms from 'ms';
import { Command } from '../../common/slash';

const MAX_SLOWMODE_SETTING_AS_STRING: string = '6h';
const MAX_SLOWMODE_SETTING: number = ms(MAX_SLOWMODE_SETTING_AS_STRING) / 1000;

const command = {
  commandName: 'slowmode',
  name: 'Slowmode',
  description: 'Turns on slowmode for a particular channel for a specified amount of time',
  defaultMemberPermissions: 'MODERATE_MEMBERS',
  options: [
    {
      type: 'NUMBER',
      name: 'expiration',
      description: 'How long to keep slowmode on for in seconds',
      required: true,
    },
    {
      type: 'NUMBER',
      name: 'delay',
      description: 'Delay between messages in seconds',
      required: true,
    },
    {
      type: 'CHANNEL',
      name: 'channel',
      description: 'Which channel to turn slowmode on for',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const createUndoFunc = (channel: TextChannel) => {
      const f = async () => {
        container.loggerService.info(`turning off slowmode in ${channel.name}`);
        await channel.setRateLimitPerUser(0);
      };
      return f;
    };

    const channelOption = interaction.options.getChannel('channel', true);

    try {
      const expiration = interaction.options.getNumber('expiration', true);
      const slowmodeSetting = interaction.options.getNumber('delay', true);
      const textChan = interaction.options.getChannel('channel', true) as TextChannel;

      console.log(textChan.name);

      if (slowmodeSetting > MAX_SLOWMODE_SETTING) {
        await interaction.reply({
          content: `I cannot set slowmode for more than ${MAX_SLOWMODE_SETTING_AS_STRING}`,
          ephemeral: true,
        });
        return;
      }

      const expDate = new Date();
      expDate.setSeconds(expDate.getSeconds() + +expiration);

      container.loggerService.info(`turning on slowmode in ${textChan.name}`);

      await Promise.all([
        textChan.send(`**ANNOUNCEMENT**\nSlowmode is on until ${expDate.toISOString()}`),
        textChan.setRateLimitPerUser(
          +slowmodeSetting,
          `slowmode command by ${interaction.user.username}`
        ),
      ]);

      // create delayed-call to undo slowmode.
      setTimeout(createUndoFunc(textChan), 1000 * +expiration);

      await interaction.reply({
        content: `Slowmode is on for ${textChan.name} for ${expiration} seconds`,
      });
    } catch (e) {
      await interaction.reply({
        content: `I couldn't set slowmode for ${channelOption.name}`,
        ephemeral: true,
      });
      return;
    }
  },
} satisfies Command;

export default command;
