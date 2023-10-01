import { Command } from '../../common/slash';
import { ClassType } from '../../common/types';

const MAX_CHANS_SHOWN: number = 10;

const plugin = {
  commandName: 'checkclasses',
  name: 'Check Class',
  description: 'lists the classes someone is in',
  defaultMemberPermissions: 'MODERATE_MEMBERS',
  options: [
    {
      name: 'user',
      description: 'The user to check',
      type: 'USER',
      required: true,
    },
  ],
  async execute({ interaction, container }) {
    const user = interaction.options.getUser('user');
    if (!user) {
      interaction.reply('User not found.');
      return;
    }

    const classes = container.classService.getClasses(ClassType.ALL);
    const chansContainingUser = Array.from(classes.values()).filter((chan) =>
      Boolean(chan.permissionsFor(user.id)?.has('VIEW_CHANNEL'))
    );

    if (chansContainingUser.length === 0) {
      await interaction.reply('User is not registered for any classes.');
      return;
    }

    if (chansContainingUser.length === Array.from(classes.keys()).length) {
      await interaction.reply('User is registered for all classes.');
      return;
    }

    const title = `User is registered for \`${chansContainingUser.length}\` classes:\n`;
    let shownChannels = chansContainingUser
      .slice(0, MAX_CHANS_SHOWN) // Cut down to max length
      .map((c) => c.name) // Convert to name
      .join('\n');

    if (chansContainingUser.length > MAX_CHANS_SHOWN) {
      shownChannels += `\nand ${chansContainingUser.length - MAX_CHANS_SHOWN} more...`;
    }
    await interaction.reply(`${title}\`\`\`\n${shownChannels}\n\`\`\``);
  },
} satisfies Command;

export default plugin;
