import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';

class Breed {
  public name: string = '';
  public id: string = '';
}

export class CatPlugin extends Plugin {
  public name: string = 'Cat Plugin';
  public description: string = 'Generates pictures of cats.';
  public usage: string = 'cat <breed (optional)>';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.thecatapi.com/v1/';
  private _breeds: Breed[] = [];

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
      })
      .catch(this.container.loggerService.get().warning);
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined || args.length === 0) {
      return;
    }

    if (args[0].includes('breed')) {
      //Simply return the list of suported breeds
      const reply = this._breeds
        .map((breedData: { name: string; id: string }) => {
          return breedData.name;
        })
        .join('\n');
      message.reply(`Breeds supported: \n\`\`\`\n${reply}\`\`\``);
      return;
    }

    const breedIn = this._parseCommand(args);

    let searchCom = '';

    // checks if their was a bread was a breed, then if that breed is recognised
    if (breedIn.length !== 0) {
      const breedEntry = this._breeds.find((breed) => breed.name === breedIn);

      if (breedEntry !== undefined) {
        searchCom = '&breed_ids=' + breedEntry.id;
      } else if (breedIn != 'random') {
        message.reply('Breed not found.');
        return;
      }
    }

    this.container.loggerService.get().silly(searchCom);

    //recieves the according info and posts, or derps
    await this.container.httpService
      .get(`${this._API_URL}images/search?limit=1${searchCom}`)
      .then((response: IHttpResponse) => {
        message.reply('', {
          files: [response.data[0].url],
        });
      })
      .catch(this.container.loggerService.get().warning);
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
