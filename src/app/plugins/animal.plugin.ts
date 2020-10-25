import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, IHttpResponse} from '../../common/types';
import { RichEmbed } from 'discord.js';
import { parse } from 'dotenv/types';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

export class AnimalPlugin extends Plugin {
  public name: string = 'Animal Plugin';
  public description: string = 'Delivers pictures of our furry friends!';
  public usage: string = 'animal';
  public pluginAlias = ['animal', "Animal"];
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://fetchit.dev/breeds/';
  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    const parsedArgs = (args || []).map((str) => str.toLowerCase()).join(' ');
    const name = parsedArgs.charAt(0).toUpperCase() + parsedArgs.slice(1);
    if (parsedArgs == "help"){
      const url = this._API_URL + "allbreeds/";
      this.ListName(url, message);
    }
    else{
    try{
        const url = this._API_URL + parsedArgs + "/";
        this.AnimalFetch(url, name, message, parsedArgs);
    }
    catch(err) {
        this.container.loggerService.warn(err);
        message.reply("Species could not be found! Please check the help");
      }
    
    }
}
private async ListName(url: string, message: IMessage){
  let speciesNames: string[] = [];
  try {
    await this.container.httpService
      .get(url)
      .then((response: IHttpResponse) => {
            const embedAnimal: RichEmbed = new RichEmbed();
            embedAnimal.setTitle("Animal list");
            embedAnimal.setColor('#7289da');
            const reply = response.data;
            reply.forEach((info : {name : string}) => speciesNames.push(info.name));
            embedAnimal.setDescription(speciesNames.join("\n"));
            embedAnimal.setFooter("Data provided by https://fetchit.dev");
            message.reply(embedAnimal);
        })
      .catch((err) => this.container.loggerService.warn(err));
    }
  catch(err) {
    this.container.loggerService.warn(err);
    }
  }


private async AnimalFetch(url: string, name: string, message: IMessage, textName: string){
  try {
    await this.container.httpService
      .get(url)
      .then((response: IHttpResponse) => {
            const embedAnimal: RichEmbed = new RichEmbed();
            embedAnimal.setTitle(name + " spotted!");
            embedAnimal.setColor('#7289da');
            embedAnimal.setImage(response["data"][textName][0]["Image"]);
            embedAnimal.setFooter("And just like that, " + textName + " is gone");
            message.reply(embedAnimal);
        })
      .catch((err) => this.container.loggerService.warn(err));
    }
  catch(err) {
    this.container.loggerService.warn(err);
    }
  }
}


