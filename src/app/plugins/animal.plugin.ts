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
  private _species: string[] = []; // All species.
  private _subspecies: ISubSpecies[] = []; // All subspecies housed by their species (not all species show here).

  private _speciesEmbed: Maybe<MessageEmbed>;
  private _subspeciesEmbed: Maybe<MessageEmbed>;

  private _ANIMAL_UPD_THRESH: number = ms('1d');
  private _LAST_UPD_TIME: number = 0;

  constructor(public container: IContainer) {
    super();
    this._updateAnimalAPIData();
  }

  public async execute(message: IMessage, args?: string[]) {
    this._updateAnimalAPIData();
    const input = args?.length ? args : [this._getRandomAnimal()];

    // Checks if they want to know what species/ subspecies are available.
    if (input[0].startsWith('list')) {
      if (!input[1] || input[1].startsWith('species')) {
        message.reply(this._makeSpeciesEmbed());
        return;
      }

      if (input[1].startsWith('subspecies')) {
        message.reply(this._makeSubspeciesEmbed());
        return;
      }

      await message.reply(this._makeSingleSubBreedEmbed(input[1]));
      return;
    }

    // Preps the lookup data, and checks if it's valid.
    const animalLookUp: string = input.join('_');
    if (!this._validAnimals.has(animalLookUp)) {
      message.reply(`\`${input}\`is a invalid species/ sub-species.`);
      return;
    }

    let searchTerms: string = `name=${animalLookUp}`;
    const speciesIndex = this._subspecies.findIndex((species) => species.species === animalLookUp);

    // Checks if it's a sub-species, it retrieves its species.
    if (!this._species.includes(animalLookUp)) {
      const species = this._subspecies.find((species) => species.subSpecies.includes(animalLookUp))
        ?.species;

      searchTerms = `name=${species}&sub-species=${animalLookUp}`;
    } else if (speciesIndex > -1) {
      // Detects if the species has subspecies.  Then applies a random sub-species accordingly.
      const subSpeciesList: string[] = this._subspecies[speciesIndex].subSpecies;
      const randomSubspecies = subSpeciesList[Math.floor(Math.random() * subSpeciesList.length)];

      searchTerms = `name=${animalLookUp}&sub-species=${randomSubspecies}`;
    }

    await this.container.httpService
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

  private _getRandomAnimal(): string {
    const animals: string[] = Array.from(this._validAnimals);
    return animals[Math.floor(Math.random() * animals.length)];
  }

  private _makeSpeciesEmbed() {
    if (this._speciesEmbed) {
      return this._speciesEmbed;
    }

    this._speciesEmbed = this.container.messageService.generateEmbedList(this._species);
    this._speciesEmbed.setColor('#0099ff').setTitle('Species');

    return this._speciesEmbed;
  }

  private _makeSubspeciesEmbed(): MessageEmbed {
    if (this._subspeciesEmbed) {
      return this._subspeciesEmbed;
    }

    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle('Subspecies');

    this._subspecies.forEach((species) => {
      embed.addField(species.species, species.subSpecies.join('\n'), true);
    });

    return (this._subspeciesEmbed = embed);
  }

  private _makeSingleSubBreedEmbed(subSpecies: string): MessageEmbed | string {
    const subSpeciesData = this._subspecies.find((e) => e.species === subSpecies)?.subSpecies;

    if (!subSpeciesData) {
      return "This Species doesn't have any sub-species.";
    }

    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle(subSpecies);
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
        const speciesData = response.data;

        this._species = Object.keys(speciesData);

        this._validAnimals = new Set(this._species);

        this._subspecies = this._species
          .filter((species) => speciesData[species].length > 0 && species != '')
          .map((species: string) => {
            return {
              species: species,
              subSpecies: speciesData[species],
            };
          });

        this._subspecies.forEach((species) => {
          species.subSpecies.forEach((subSpecies) => this._validAnimals.add(subSpecies));
        });

        this._subspecies.sort(
          (a: ISubSpecies, b: ISubSpecies) => a.subSpecies.length - b.subSpecies.length
        );
      })
      .catch((err) => this.container.loggerService.warn(err));

    // Clears out the saved embeds so that they can be reset upon the next call.
    this._speciesEmbed = undefined;
    this._subspeciesEmbed = undefined;
  }
}

interface ISubSpecies {
  species: string;
  subSpecies: string[];
}
