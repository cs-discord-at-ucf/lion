import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';
import { MessageEmbed } from 'discord.js';

class Breed {
  public name: string = '';
  public id: string = '';
}

export class CatPlugin extends Plugin {
  public name: string = 'Cat Plugin';
  public description: string = 'Generates pictures of cats.';
  public usage: string = 'cat <breed (optional)>';
  public pluginAlias = ['cats'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.thecatapi.com/v1/';
  private _breeds: Breed[] = [];
  private _embedBreeds = new MessageEmbed();

  constructor(public container: IContainer) {
    super();
    //creates list of breeds
    this.container.httpService
      .get(`${this._API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breeds = response.data;

        this._breeds = breeds.map((breedData: { name: string; id: string }) => {
          return {
            name: breedData.name.toLowerCase(),
            id: breedData.id.toLowerCase(),
          };
        });

        const breedsAsArray = this._breeds.map((breedData: { name: string; id: string }) => {
          return breedData.name;
        });
        this._embedBreeds = container.messageService.generateEmbedList('Breeds', breedsAsArray);
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined || args.length === 0) {
      args = [''];
    }

    if (args[0].includes('breed')) {
      //Simply return the list of supported breeds
      message.reply(this._embedBreeds);
      return;
    }

    const breedIn = this._parseCommand(args);

    let searchCom = '';

    // checks if their was a bread was a breed, then if that breed is recognised
    const breedEntry = this._breeds.find((breed) => breed.name === breedIn);

    if (breedEntry !== undefined) {
      searchCom = '&breed_ids=' + breedEntry.id;
    } else if (breedIn != 'random' && breedIn != '') {
      message.reply('Breed not found.');
      return;
    }

    this.container.loggerService.debug(searchCom);

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}images/search?limit=1${searchCom}`)
      .then((response: IHttpResponse) => {
        message.reply('', {
          files: [response.data[0].url],
        });
      })
      .catch((err) => this.container.loggerService.warn(err));
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
