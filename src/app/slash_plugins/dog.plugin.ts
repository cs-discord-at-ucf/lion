import { MessageEmbed } from 'discord.js';
import levenshtein from 'js-levenshtein';
import { Command } from '../../common/slash';
import { IContainer, IHttpResponse } from '../../common/types';
import ALL_BREEDS from '../__generated__/dog-breeds.json';

const breeds = Object.keys(ALL_BREEDS);
const subBreeds = Object.entries(ALL_BREEDS)
  .filter(([, value]) => value.length > 0)
  .reduce(
    (acc, [superBreed, subBreeds]) => acc.set(superBreed, subBreeds),
    new Map<string, string[]>()
  );
const allBreeds = new Set(['list', 'listsubbreeds', ...breeds, ...subBreeds.values()].flat());

const API_URL: string = 'https://dog.ceo/api/';

const plugin: Command = {
  commandName: 'dog',
  name: 'Dog Plugin',
  description: 'Generates pictures of doggos.',
  options: [
    {
      name: 'breed',
      description: 'The breed of dog to generate. Or "list" to list all breeds.',
      type: 'STRING',
      required: false,
      autocomplete: true,
    },
  ],

  async autocomplete({ interaction }) {
    const query = interaction.options.getString('breed', true).toLowerCase();
    const results = [...allBreeds].sort((a, b) => levenshtein(query, a) - levenshtein(query, b));

    await interaction.respond(
      results
        .map((result) => ({
          name: result,
          value: result,
        }))
        .slice(0, 25)
    );
  },

  async execute({ interaction, container }) {
    if (allBreeds.size === 0) {
      await interaction.reply('No breeds found at this time');
      return;
    }

    const breed = interaction.options.getString('breed')?.toLowerCase() ?? 'random';

    if (breed === 'list') {
      await interaction.reply({ embeds: [makeBreedEmbed(container)], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    if (breed === 'listsubbreeds') {
      const breedType = breed.replace('listsubbreeds', '').trim();

      if (!breedType) {
        await interaction.followUp({ embeds: [makeSubBreedEmbed()] });
        return;
      }

      if (breeds.includes(breedType)) {
        await interaction.followUp({ embeds: [makeSingleSubBreedEmbed(breedType)] });
        return;
      }
    }

    // The breed and subbreed is reversed for lookup
    const searchBreed = breed.replace(' ', '/');
    console.log(searchBreed);

    let url = `breed/${searchBreed}/images/random`;

    if (breed === '' || breed === 'random') {
      url = 'breeds/image/random';
    } else {
      // List isn't reversed
      if (!allBreeds.has(breed)) {
        await interaction.followUp('Breed not found.');
        return;
      }
    }

    await container.httpService
      .get(`${API_URL}${url}`)
      .then(async (response: IHttpResponse) => {
        // Notifies the user if there was a problem contacting the server
        if (Math.floor(response.status / 100) !== 2) {
          interaction.followUp(
            `Something seems to have happened with the connection to ${API_URL}.`
          );
          return;
        }

        await interaction.followUp({
          files: [{ attachment: response.data.message, name: 'img.jpg' }],
        });
      })
      .catch((err) => {
        container.loggerService.warn(err);
      });
  },
};
const makeBreedEmbed = (container: IContainer): MessageEmbed => {
  const breedEmbed = container.messageService.generateEmbedList(breeds);
  breedEmbed.setColor('#0099ff').setTitle('Breeds');

  return breedEmbed;
};

const makeSubBreedEmbed = (): MessageEmbed => {
  const embed = new MessageEmbed();
  embed.setColor('#0099ff').setTitle('Sub Breeds');

  for (const [breed, _subBreeds] of subBreeds.entries()) {
    embed.addField(breed, _subBreeds.join('\n'), true);
  }

  return embed;
};

const makeSingleSubBreedEmbed = (subBreed: string): MessageEmbed => {
  const subBreedData = subBreeds.get(subBreed);

  if (!subBreedData) {
    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(subBreed)
      .setDescription("This breed doesn't have any sub-breeds.");
  }

  const embed = new MessageEmbed();
  embed.setColor('#0099ff').setTitle(subBreed);
  embed.setDescription(subBreedData.join('\n'));

  return embed;
};

export default plugin;
