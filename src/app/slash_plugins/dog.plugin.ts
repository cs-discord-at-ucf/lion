import { MessageEmbed } from 'discord.js';
import { ISlashCommand } from '../../common/slash';
import { IContainer, IHttpResponse } from '../../common/types';

interface IDogSubBreed {
  breed: string;
  subBreed: string[];
}

const API_URL: string = 'https://dog.ceo/api/';

let allBreeds: Set<string> = new Set([]);
let breeds: string[] = [];
let subBreeds: IDogSubBreed[] = [];

const plugin: ISlashCommand = {
  commandName: 'dog',
  name: 'Dog Plugin',
  description: 'Generates pictures of doggos.',
  options: [
    {
      name: 'breed',
      description: 'The breed of dog to generate. Or "list" to list all breeds.',
      type: 'STRING',
      required: false,
    },
  ],

  initialize(container) {
    GetBreeds(container);
  },

  async execute({ interaction, container }) {
    await interaction.deferReply();
    if (allBreeds.size === 0) {
      await interaction.followUp('No breeds found at this time');
      return;
    }

    const breed = interaction.options.getString('breed')?.toLowerCase() ?? 'random';
    if (breed.startsWith('listsubbreeds')) {
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

    if (breed.startsWith('list')) {
      await interaction.followUp({ embeds: [makeBreedEmbed(container)] });
      return;
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

  subBreeds.forEach((breed) => {
    embed.addField(breed.breed, breed.subBreed.join('\n'), true);
  });

  return embed;
};

const makeSingleSubBreedEmbed = (subBreed: string): MessageEmbed => {
  const subBreedData = subBreeds.find((e) => e.breed === subBreed)?.subBreed;

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

const GetBreeds = async (container: IContainer) => {
  await container.httpService
    .get(`${API_URL}breeds/list/all`)
    .then((response: IHttpResponse) => {
      const breedData = response.data.message;

      breeds = Object.keys(breedData);
      allBreeds = new Set(Object.keys(breedData));

      // The json is annoyingly {<breed>: [<subBreeds>]} apposed to {breed: <breed>, subBreed: [<subBreeds>]}} so this gets that
      subBreeds = breeds
        .filter((breed) => breedData[breed].length > 0)
        .map((breed: string) => {
          return {
            breed: breed,
            subBreed: breedData[breed].map((subBreed: string) => `${subBreed} ${breed}`), // flipped the breed and subBreed
          };
        });

      subBreeds.forEach((breed) => {
        breed.subBreed.forEach((subBreed) => allBreeds.add(subBreed));
      });

      // Sorting the subBreed list so the embed looks better
      subBreeds.sort((a: IDogSubBreed, b: IDogSubBreed) => a.subBreed.length - b.subBreed.length);
    })
    .catch((err) => container.loggerService.warn(err));
};

export default plugin;
