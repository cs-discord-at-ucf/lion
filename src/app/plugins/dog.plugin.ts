import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage, Maybe } from '../../common/types';

export default class DogPlugin extends Plugin {
  public name: string = 'dog';
  public displayName: string = 'Dog Plugin';
  public description: string = 'Generates pictures of doggos.';
  public usage: string =
  'dog <subbreed (Optional)>  <breed (Optional)> | dog listBreeds | dog listSubBreeds <breed (Optional)>';
  public pluginAlias = ['dogs', 'doggo'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://dog.ceo/api/';

  private _allBreeds: Set<string> = new Set([]);
  private _breeds: string[] = [];
  private _subBreeds: IDogSubBreed[] = [];

  private _breedEmbed: Maybe<MessageEmbed>;
  private _subBreedEmbed: Maybe<MessageEmbed>;

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds/list/all`)
      .then((response: IHttpResponse) => {
        const breedData = response.data.message;

        this._breeds = Object.keys(breedData);
        this._allBreeds = new Set(Object.keys(breedData));

        // The json is annoyingly {<breed>: [<subBreeds>]} apposed to {breed: <breed>, subBreed: [<subBreeds>]}} so this gets that
        this._subBreeds = this._breeds
          .filter((breed) => breedData[breed].length > 0)
          .map((breed: string) => {
            return {
              breed: breed,
              subBreed: breedData[breed].map((subBreed: string) => `${subBreed} ${breed}`), // flipped the breed and subBreed
            };
          });

        this._subBreeds.forEach((breed) => {
          breed.subBreed.forEach((subBreed) => this._allBreeds.add(subBreed));
        });

        // Sorting the subBreed list so the embed looks better
        this._subBreeds.sort(
          (a: IDogSubBreed, b: IDogSubBreed) => a.subBreed.length - b.subBreed.length
        );
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    const breed = this._parseInput(args || []);

    if (breed.startsWith('listsubbreeds')) {
      const breedType = breed.replace('listsubbreeds', '').trim();

      if (!breedType) {
        await message.reply(this._makeSubBreedEmbed());
        return;
      }

      if (this._breeds.includes(breedType)) {
        await message.reply(this._makeSingleSubBreedEmbed(breedType));
        return;
      }
    }

    if (breed.startsWith('listbreeds')) {
      await message.reply(this._makeBreedEmbed());
      return;
    }

    // The breed and subbreed is reversed for lookup
    const searchBreed = this._parseInput(args?.reverse() || []).replace(' ', '/');
    let url = `breed/${searchBreed}/images/random`;

    if (breed === '' || breed === 'random') {
      url = 'breeds/image/random';
    } else {
      // List isn't reversed
      if (!this._allBreeds.has(breed)) {
        // check concatenation of 2 args is breed
        if (args?.length === 2) {
          const catBreed = breed.replace(' ', '');
          if (this._allBreeds.has(catBreed)) {
            url = `breed/${catBreed}/images/random`;
          } else {
            await message.reply(`\`${breed}\` is an invalid breed.`);
            return;
          }
        } else {
          await message.reply(`\`${breed}\` is an invalid breed.`);
          return;
        }
      }
    }

    await this.container.httpService
      .get(`${this._API_URL}${url}`)
      .then(async (response: IHttpResponse) => {
        // Notifies the user if there was a problem contacting the server
        if (Math.floor(response.status / 100) !== 2) {
          message.reply(
            `Something seems to have happened with the connection to ${this._API_URL}.`
          );
          return;
        }

        await message.reply('', {
          files: [response.data.message],
          name: 'image.jpg',
        });
      })
      .catch((err) => {
        this.container.loggerService.warn(err);
      });
  }

  private _makeBreedEmbed(): MessageEmbed {
    if (this._breedEmbed) {
      return this._breedEmbed;
    }

    this._breedEmbed = this.container.messageService.generateEmbedList(this._breeds);
    this._breedEmbed.setColor('#0099ff').setTitle('Breeds');

    return this._breedEmbed;
  }

  private _makeSubBreedEmbed(): MessageEmbed {
    if (this._subBreedEmbed) {
      return this._subBreedEmbed;
    }

    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle('Sub Breeds');

    this._subBreeds.forEach((breed) => {
      embed.addField(breed.breed, breed.subBreed.join('\n'), true);
    });

    return (this._subBreedEmbed = embed);
  }

  private _makeSingleSubBreedEmbed(subBreed: string): MessageEmbed | string {
    const subBreedData = this._subBreeds.find((e) => e.breed === subBreed)?.subBreed;

    if (!subBreedData) {
      return "This breed doesn't have any sub-breeds.";
    }

    const embed = new MessageEmbed();
    embed.setColor('#0099ff').setTitle(subBreed);
    embed.setDescription(subBreedData.join('\n'));

    return embed;
  }

  private _parseInput(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}

interface IDogSubBreed {
  breed: string;
  subBreed: string[];
}
