import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';

class Breed {
    public breed: string = '';
    public id: string = '';
  }

export class CatPlugin extends Plugin {
  public name: string = 'Cat Plugin';
  public description: string = 'Generates pictures of cats, via popular command.';
  public usage: string = 'cat breed or pic bomb(optional) <breed (optional)>';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.thecatapi.com/v1/';
  private _breadCat: string = `https://www.thetoychronicle.com/wp-content/uploads/2016/05/Box-cat-Bread-cat-Rato-workroom-Kim-.jpg`;
  private _cats: Breed[] = [];

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breeds = response.data;

        for (let index = 0; index < breeds.length; index++) {

            const breedInfo = {
                breed: breeds[index].name.toLowerCase(),
                id: breeds[index].id.toLowerCase(),
            };

            this._cats.push(breedInfo);
        }
      })
      .catch((err) => console.log(err));
  }

  public async execute(message: IMessage, args?: string[]) {
    
    let command = this._parseCommand(args || []);
    
    if (command === "breeds" || command === "breed") {
        
        //Simply return the list of suported breeds
        let reply = "";

        this._cats.forEach(cat => {
            reply = reply.concat(cat.breed, "\n");
        });

        message.reply(`Breeds supported: \n\`\`\`\n${reply}\`\`\``);
        return;

    } else if (command === "breads" || command === "bread") {

        // the Easter Egg, my gawd
        message.reply('', {
            files: [this._breadCat],
        });

    } else if (command.includes("pic")) {
        // lets the system know that pic has been determined

        command = command.replace("pic", "");
        let breed: string = "";

        // determines that their was aditional text added on
        if (command.trim() != "") {

            //finds the breed
            this._cats.forEach(cat => {
                if (command.includes(cat.breed)) {
                    breed = cat.id;
                    return;
                }
            });

            // checks if the bread was found or not
            if (breed === "") {
                message.reply(`I could not find that breed. Have this picture instead. Please type, "cat breed" to get a list of compatible breeds.`);
            } else {
                breed = `&breed_id=${breed}`;
            }
        }
        
        //recieves the according info and posts, or derps
        await this.container.httpService
        .get(`${this._API_URL}images/search?limit=1${breed}`)
        .then((response: IHttpResponse) => {
            message.reply('', {
                files: [response.data[0].url],
            });
        })
        .catch(console.log);
    }
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}