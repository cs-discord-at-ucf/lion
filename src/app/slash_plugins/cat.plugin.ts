import levenshtein from 'js-levenshtein';
import { Command } from '../../common/slash';
import { IContainer, IHttpResponse } from '../../common/types';
import ALL_BREEDS from '../__generated__/cat-breeds.json';

const API_URL: string = 'https://api.thecatapi.com/v1/';
const breedNames = ['list', ...ALL_BREEDS.map((breed) => breed.name.toLowerCase())];

const plugin: Command = {
  commandName: 'cat',
  name: 'Cat Plugin',
  description: 'Generates pictures of cats.',
  options: [
    {
      name: 'breed',
      description: 'The breed of cat to generate. Or "list" to list all breeds.',
      type: 'STRING',
      required: false,
      autocomplete: true,
    },
  ],
  async autocomplete({ interaction }) {
    const query = interaction.options.getString('breed')?.toLowerCase() ?? '';
    const results = breedNames.sort((a, b) => levenshtein(query, a) - levenshtein(query, b));

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
    if (interaction.options.getString('breed') === 'list') {
      await interaction.reply({
        embeds: [getListEmbed(container)],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    let searchCom = '';

    const breedIn = interaction.options.getString('breed')?.toLowerCase() ?? 'random';
    // checks if their was a bread was a breed, then if that breed is recognized
    const breedEntry = ALL_BREEDS.find((breed) => breed.name === breedIn);

    if (breedEntry !== undefined) {
      searchCom = '&breed_ids=' + breedEntry.id;
    } else if (breedIn !== 'random' && breedIn !== '') {
      interaction.followUp('Breed not found.');
      return;
    }

    // receives the according info and posts
    await container.httpService
      .get(`${API_URL}images/search?limit=1${searchCom}`)
      .then((response: IHttpResponse) => {
        interaction.followUp({
          files: [{ attachment: response.data[0].url, name: 'img.jpg' }],
        });
      })
      .catch((err) => container.loggerService.warn(err));
  },
};

const getListEmbed = (container: IContainer) => {
  const breedsAsArray = ALL_BREEDS.map((breedData: { name: string; id: string }) => {
    return breedData.name;
  });

  const embed = container.messageService.generateEmbedList(breedsAsArray);
  embed.setColor('#0099ff').setTitle('Breeds');

  return embed;
};

export default plugin;
