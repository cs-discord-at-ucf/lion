import { CommandInteraction, Message, MessageEmbed, TextChannel } from 'discord.js';
import Constants from '../../common/constants';
import { Command } from '../../common/slash';
import { IContainer, IMessage, Maybe } from '../../common/types';

const LISTING_PREFIX = '!marketplace add';
const ALIAS_PREFIX = '!market add';
const MAX_CHAR_LENGTH = 2000;
let LINK_PREFIX: Maybe<string> = null;

export default {
  commandName: 'marketplace',
  name: 'MarketPlace',
  description: 'Stores and Lists Everything On MarketPlace.',
  options: [
    {
      type: 'SUB_COMMAND',
      name: 'list',
      description: 'List all items on the marketplace',
    },
  ],
  async execute({ interaction, container }) {
    const sub_command = interaction.options.getSubcommand();

    if (sub_command === 'list') {
      await handleListMarket(interaction, container);
    }
  },
} satisfies Command;

const handleListMarket = async (interaction: CommandInteraction, container: IContainer) => {
  const oldMessages = await container.messageService.fetchMessages(getSellChannel(container), 300);
  const itemsForSale = fetchListings(container, oldMessages);
  if (!itemsForSale.length) {
    await interaction.reply({ content: 'Sorry, I could not find any listings', ephemeral: true });
    return;
  }

  const chunks = [];
  // Still items left to batch
  while (itemsForSale.length > 0) {
    let curLength = 0;
    const temp = [];

    // While this listing wont exceed limit
    while (
      itemsForSale.length &&
      curLength + itemsForSale[itemsForSale.length - 1].length < MAX_CHAR_LENGTH
    ) {
      temp.push(itemsForSale.pop() as string);

      curLength = temp.join('').length;
    }

    chunks.push(temp.reverse());
  }

  const pages: MessageEmbed[] = createListingEmbed(chunks);
  return container.messageService.sendPagedEmbed(interaction, pages, { ephemeral: true });
};

const createListingEmbed = (chunks: string[][]): MessageEmbed[] => {
  return chunks.map((items) => {
    const embed = new MessageEmbed();
    embed.setTitle('Items For Sale');
    embed.setColor('#7289da');
    embed.setDescription(items.reverse().join('\n\n'));
    return embed;
  });
};

const fetchListings = (container: IContainer, messages: Message[]): string[] => {
  return messages
    .filter((msg) => msg.content.startsWith(LISTING_PREFIX) || msg.content.startsWith(ALIAS_PREFIX))
    .map((msg) => resolveToListing(container, msg))
    .filter((l) => Boolean(l))
    .filter((l) => l.length < MAX_CHAR_LENGTH);
};

const resolveToListing = (container: IContainer, msg: IMessage): string => {
  const item = parseItemFromMessage(msg);

  if (!item.length) {
    return '';
    /* The messages are already filtered before this function is called
      So this should theoretically never be true*/
  }

  const user = msg.author;
  return `${item}\n ${user.toString()} [Link](${createMessageLink(container, msg.id)})`;
};

const parseItemFromMessage = (msg: IMessage) => {
  const [, ...temp] = msg.content.split('add');
  return temp.join('add');
};

const createMessageLink = (container: IContainer, id: string) => {
  if (!LINK_PREFIX) {
    const guildID = container.guildService.get().id;
    const chanID = getSellChannel(container).id;
    LINK_PREFIX = `https://discord.com/channels/${guildID}/${chanID}/`;
  }

  return `${LINK_PREFIX}${id}`;
};

const getSellChannel = (container: IContainer): TextChannel => {
  return container.guildService.getChannel(Constants.Channels.Public.BuySellTrade) as TextChannel;
};
