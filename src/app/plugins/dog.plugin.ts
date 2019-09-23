import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType, IHttpResponse } from '../../common/types';
import Constants from '../../common/constants';
import { TextChannel } from 'discord.js';

export class DogPlugin extends Plugin {
  public name: string = 'Dog Plugin';
  public description: string = 'Generates pictures of doggos.';
  public usage: string = 'dog <breed>';
  public permission: ChannelType = ChannelType.Public;

  private _API_URL: string = 'https://api.woofbot.io/v1/';
  private _breeds: string[] = [];

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breeds: string[] = response.data.response.breeds;
        breeds.forEach((breed) => {
          this._breeds.push(breed.toLowerCase());
        });
      })
      .catch((err) => console.log(err));
  }

  public validate(message: IMessage, args: string[]) {
    // in order to error handle
    return true;
  }

  public async execute(message: IMessage, args?: string[]) {
    const breed = this._parseBreed(args || []);
    const channelObj: TextChannel = this.container.clientService.channels.get(message.channel.id) as TextChannel;
    // TODO (joey-colon): Abstract validation logic into validate method.
    if (channelObj.name !== Constants.Channels.Public.Pets) {
      message.reply(`This command is only available within the \`Pets\` channel.`);
      return;
    }

    if (!this._breeds.includes(breed)) {
      message.reply(`Breeds supported: \n\`\`\`\n${this._breeds.join('\n')}\`\`\``);
      return;
    }

    await this.container.httpService
      .get(`${this._API_URL}breeds/${breed}/image`)
      .then((response: IHttpResponse) => {
        if (!!response.data.response.url) {
          message.reply('', {
            files: [response.data.response.url],
          });
        }
      })
      .catch((err) => console.log(err));
  }

  private _parseBreed(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
