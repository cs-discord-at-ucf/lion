import {
  ButtonInteraction,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageButton,
} from 'discord.js';
import ms from 'ms';
import { Voidable } from './types';

export const getRandom = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export const getConfirmCancelRow = () => {
  return new MessageActionRow({
    components: [
      new MessageButton().setCustomId('confirm').setLabel('Confirm').setStyle('SUCCESS'),
      new MessageButton().setCustomId('cancel').setLabel('Cancel').setStyle('DANGER'),
    ],
  });
};

export const createConfirmationReply = async (
  interaction: CommandInteraction,
  options: {
    payload: InteractionReplyOptions;
    onConfirm: (btnInteraction: ButtonInteraction) => Voidable;
    onCancel?: (btnInteraction: ButtonInteraction) => Voidable;
    duration?: number;
  }
) => {
  const { payload, onConfirm, onCancel, duration } = options;

  const msg = (await interaction.reply({
    ...payload,
    components: [getConfirmCancelRow()],
    fetchReply: true,
  })) as Message;

  const collector = msg.createMessageComponentCollector({
    componentType: 'BUTTON',
    time: duration ?? ms('5m'),
  });

  collector.on('collect', async (btnInteraction) => {
    await btnInteraction.deferUpdate();
    if (btnInteraction.customId === 'confirm') {
      await onConfirm(btnInteraction);
    } else {
      (await onCancel?.(btnInteraction)) ?? btnInteraction.followUp({ content: 'Cancelled' });
    }

    collector.stop();
  });

  collector.on('end', async () => {
    await msg.edit({ components: [] });
  });
};
