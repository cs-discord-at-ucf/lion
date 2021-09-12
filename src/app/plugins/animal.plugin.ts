import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage, Maybe } from '../../common/types';
import { MessageEmbed } from 'discord.js';
import ms from 'ms';

export default class AnimalPlugin extends Plugin {
  public commandName: string = 'animal';
  public name: string = 'Animal Plugin';
  public description: string = 'Get wild with a fraction of gods creatures';
  public usage: string =
    'animal <Species (optional)> <subSpecies(Optional)> | animal list (species or <species> or subSpecies)';
  public pluginAlias = ['wild', 'species'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.fetchit.dev/';

  private _validAnimals: Set<string> = new Set([]); // All animals and species
  private _animals: ISubSpecies[] = []; // All species.

  private _ANIMAL_UPD_THRESH: number = ms('1d');
  private _LAST_UPD_TIME: number = 0;

  constructor(public container: IContainer) {
    super();
    this._updateAnimalAPIData();
  }

  public execute(message: IMessage, args?: string[]) {
    this._updateAnimalAPIData();
    const input = args?.length ? args : [this._getRandomAnimal()];

    // Checks if they want to know what species/ subspecies are available.
    if (input[0].startsWith('list')) {
      this._pickListType(message, input[1]);
      return;
    }

    // Preps the lookup data, and checks if it's valid.
    const animalLookUp: string = input.join('_');
    if (!this._validAnimals.has(animalLookUp)) {
      message.reply(`\`${input}\`is a invalid species/ sub-species.`);
      return;
    }

    let searchTerms: string = `name=${animalLookUp}`;
    const animalIndex = this._animals.findIndex((animal) => animal.species === animalLookUp);
    const species = this._findAnimalsFromSubspecies(animalLookUp)?.species;

    // Checks if it's a sub-species, if so it retrieves its species.
    if (species !== undefined) {
      searchTerms = `name=${species}&sub-species=${animalLookUp}`;
    } else if (this._animals[animalIndex].subSpecies.length > 0) {
      // Detects if the species has subspecies.  Then applies a random sub-species accordingly.
      const subSpeciesList: string[] = this._animals[animalIndex].subSpecies;
      const randomSubspecies = subSpeciesList[Math.floor(Math.random() * subSpeciesList.length)];

      searchTerms = `name=${animalLookUp}&sub-species=${randomSubspecies}`;
    }

    this.container.httpService
      .get(`${this._API_URL}species/?${searchTerms}`)
      .then(async (response: IHttpResponse) => {
        // Notifies the user if there was a problem contacting the server
        if (Math.floor(response.status / 100) !== 2) {
          message.reply(
            `Something seems to have happened with the connection to ${this._API_URL}.`
          );
          return;
        }

        const [animalData] = response.data.animal;
        await message.reply('', { files: [animalData.Image], name: 'image.jpg' });
      })
      .catch((err) => {
        this.container.loggerService.warn(err);
      });
  }

  private async _pickListType(message: IMessage, listType?: string) {
    if (!listType || listType.startsWith('species')) {
      message.reply(this._makeSpeciesEmbed());
      return;
    }

    if (listType.startsWith('subspecies')) {
      message.reply(this._makeSubspeciesEmbed());
      return;
    }

    await message.reply(this._makeSingleSubSpeciesEmbed(listType));
    return;
  }

  private _getRandomAnimal(): string {
    const animals: string[] = Array.from(this._validAnimals);
    return animals[Math.floor(Math.random() * animals.length)];
  }

  private _makeSpeciesEmbed() {
    const species: string[] = this._animals.map((animal: ISubSpecies) => animal.species);
    const animalEmbed: MessageEmbed = this.container.messageService.generateEmbedList(species);
    animalEmbed.setColor('#0099ff').setTitle('Species');

    return animalEmbed;
  }

  private _makeSubspeciesEmbed(): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle('Subspecies');

    this._animals
      .filter((animal) => !!animal.subSpecies)
      .forEach((animal) => {
        embed.addField(animal.species, animal.subSpecies.join('\n'), true);
      });

    return embed;
  }

  private _findAnimalsFromSubspecies(subspecies: string) {
    return this._animals.find((animal) => animal.subSpecies.includes(subspecies));
  }

  private _findAnimalsFromSpecies(species: string) {
    return this._animals.find((animal) => animal.species === species);
  }

  private _makeSingleSubSpeciesEmbed(species: string): MessageEmbed | string {
    const subSpeciesData = this._findAnimalsFromSpecies(species)?.subSpecies;

    if (!subSpeciesData) {
      return "This Species doesn't have any sub-species.";
    }

    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle(species);
    embed.setDescription(subSpeciesData.join('\n'));

    return embed;
  }

  private _updateAnimalAPIData() {
    // Checks if the API has passed it refresh time
    const lastAnimalUpdate: number = Date.now() - this._LAST_UPD_TIME;
    if (lastAnimalUpdate < this._ANIMAL_UPD_THRESH) {
      return;
    }

    this._LAST_UPD_TIME = Date.now();

    this.container.httpService
      .get(`${this._API_URL}species/allspecies/`)
      .then((response: IHttpResponse) => {
        const animalData = response.data;
        this._validAnimals = new Set(Object.keys(animalData));

        this._animals = Object.keys(animalData).map((species) => {
          return {
            species: species,
            subSpecies: animalData[species],
          };
        });

        this._animals.forEach((animal) => {
          if (animal.subSpecies.length > 0) {
            animal.subSpecies.forEach((subSpecies) => {
              this._validAnimals.add(subSpecies);
            });
          }
        });
      })
      .catch((err) => this.container.loggerService.warn(err));
  }
}

interface ISubSpecies {
  species: string;
  subSpecies: string[];
}
