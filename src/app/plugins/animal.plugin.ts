import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IHttpResponse } from '../../common/types';
import { RichEmbed } from 'discord.js';

export class AnimalPlugin extends Plugin {
  public name: string = 'Animal Plugin';
  public description: string = 'Delivers pictures of our furry friends!';
  public usage: string = 'animal';
  public pluginAlias = ['animal', 'Animal'];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://fetchit.dev/species/';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    if (args === undefined || args.length === 0) {
      args = [''];
    }

    const parsedArgs = this._parseCommand(args);

    if (parsedArgs.includes('help')) {
      this.listAvailableAnimal(message);
    } else {
      this.animalFetch(message, parsedArgs);
    }
  }

  private listAvailableAnimal(message: IMessage) {
    const speciesNames: string[] = [];
    try {
      this.container.httpService
        .get(this._API_URL + 'allspecies/')
        .then((response: IHttpResponse) => {
          const embedAnimal: RichEmbed = new RichEmbed();
          embedAnimal.setTitle('Animal list');
          embedAnimal.setColor('#7289da');
          const reply = response.data;
          reply.forEach((info: { name: string }) => speciesNames.push(info.name));
          embedAnimal.setDescription(speciesNames.join('\n'));
          embedAnimal.setFooter('Data provided by https://fetchit.dev');
          message.reply(embedAnimal);
        });
    } catch (err) {
      this.container.loggerService.warn(err);
    }
  }

  private animalFetch(message: IMessage, textName: string) {
    try {
      const animalName = textName.charAt(0).toUpperCase() + textName.slice(1);
      this.container.httpService
        .get(this._API_URL + '?name=' + textName)
        .then((response: IHttpResponse) => {
          const embedAnimal: RichEmbed = new RichEmbed();
          try {
            embedAnimal.setTitle(animalName + ' spotted!');
            embedAnimal.setColor('#7289da');
            embedAnimal.setImage(response['data']["animal"][0]['Image']);
            embedAnimal.setFooter('And just like that, ' + textName + ' is gone');
            message.reply(embedAnimal);
          } catch (err) {
            this.container.loggerService.warn(err);
            message.reply('cannot get animal species, check the help to get the list!');
          }
        });
    } catch (err) {
      this.container.loggerService.warn(err);
    }
  }

  // Gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}
