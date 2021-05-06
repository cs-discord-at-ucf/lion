import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage, Maybe } from '../../common/types';

export class DogPlugin extends Plugin {
  public name: string = 'Dog Plugin';
  public description: string = 'Generates pictures of doggos.';
  public usage: string = 'dog <breed (Optional)> | dog breed | dog subBreed | dog random';
  public pluginAlias = ['dogs', 'doggo'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://dog.ceo/api/';

  private _allBreeds: string[] = [];
  private _breeds: string[] = [];
  private _subBreeds: _DogSubBreed[] = [];

  private _breedEmbed: Maybe<MessageEmbed>;
  private _subBreedEmbed: Maybe<MessageEmbed>;

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds/list/all`)
      .then((response: IHttpResponse) => {
        const breedData = response.data.message;
        this._breeds = this._allBreeds = Object.keys(breedData);

        // The json is annoyingly {<breed>: [<subBreeds>]} apposed to {breed: <breed>, subBreed: [<subBreeds>]}} so this gets that
        this._breeds.forEach((breed: string) => {
          // Filtering out the the breeds that lack any subbreeds
          if (breedData[breed].length <= 0) {
            return;
          }
          const subBreeds = breedData[breed].map((subBreed: string) => `${subBreed} ${breed}`); // flipped the breed and subBreed
          this._allBreeds = this._allBreeds.concat(subBreeds);

          this._subBreeds.push({
            breed: breed,
            subBreed: subBreeds,
          });
        });

        // Sorting the subBreed list so the embed looks better
        this._subBreeds.sort((a: any, b: any) => a.subBreed.length - b.subBreed.length);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    // Items in the list are reversed, so the input needs reversing.
    const breed = this._parseInput(args?.reverse() || []);

    if (breed.startsWith('subbreed')) {
      await message.reply(await this._makeSubBreedEmbed());
      return;
    }

    if (breed.startsWith('breed')) {
      await message.reply(await this._makeBreedEmbed());
      return;
    }

    let url = `breed/${breed.replace(' ', '/')}/images/random`; // The / slash is just how the API takes in the sub breeds

    if (breed === '' || breed === 'random') {
      url = 'breeds/image/random';
    } else {
      if (!this._allBreeds.includes(breed)) {
        message.reply(`${breed}, is an invalid breed.`);
        return;
      }
    }

    await this.container.httpService
      .get(`${this._API_URL}${url}`)
      .then((response: IHttpResponse) => {
        // notifies the user if their was a problem contacting the server
        if (Math.floor(response.status / 100) != 2) {
          message.reply(
            `Something seems to have happened with the connection to ${this._API_URL}.`
          );
          return;
        }

        message.reply('', {
          files: [response.data.message],
        });
      })
      .catch((err) => {
        this.container.loggerService.warn(err);
      });
  }

  private async _makeBreedEmbed(): Promise<MessageEmbed> {
    if (this._breedEmbed) {
      return this._breedEmbed;
    }

    this._breedEmbed = await this.container.messageService.generateEmbedList(this._breeds, {
      title: 'Sub Breeds',
    });

    return this._breedEmbed;
  }

  private async _makeSubBreedEmbed(): Promise<MessageEmbed> {
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

  private _parseInput(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}

interface _DogSubBreed {
  breed: String;
  subBreed: String[];
}
