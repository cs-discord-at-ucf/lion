import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IHttpResponse, IMessage } from '../../common/types';

export class CatPlugin extends Plugin {
  public name: string = 'Cat Plugin';
  public description: string = 'Generates pictures of cats, via popular command.';
  public usage: string = 'cat breed or pic bomb(optional) <breed (optional)>';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pets;

  private _API_URL: string = 'https://api.thecatapi.com/v1/';
  private _breeds: string[] = [];
  private _breedsID: string[] = [];

  constructor(public container: IContainer) {
    super();
    this.container.httpService
      .get(`${this._API_URL}breeds`)
      .then((response: IHttpResponse) => {
        const breeds = response.data;

        for (let index = 0; index < breeds.length; index++) {
            const breed = breeds[index].name;
            const breedID = breeds[index].id;
            this._breeds.push(breed.toLowerCase())
            this._breedsID.push(breedID.toLowerCase())
        }
    
        // Doesn't work due to the the way the JSON info is now listed, Would be interested in how to do it with foreach if anyone could tell me.
        // breeds.forEach((breed) => {
        //   this._breeds.push(breed.toLowerCase());
        // });
      })
      .catch((err) => console.log(err));
  }

  public async execute(message: IMessage, args?: string[]){

    var command = this._parseCommand(args || []);
    
    if (command.includes("fact")) {

        // fact is not yet supported by the API at this time however this code should work upon its release
        
        // command = command.replace("fact", "");
        // if (command.includes("breeds")) {

        //     message.reply(`Breeds supported: \n\`\`\`\n${this._breeds.join('\n')}\`\`\``);
        //     return;

        // } else {

        //     var search = "";

        //     if (command != "fact") {

        //         search = command.replace("fact", "");


        //         const index = this._breeds.findIndex((curBreed) => {
        //             return command.includes(curBreed);
        //         })

        //         breed = `breed_id=${this._breedsID[index]}`;
        //     }

        //     await this.container.httpService
        //     .get(`${this._API_URL}facts/${search}`)
        //     .then((response: IHttpResponse) => {

        //         message.reply('', {
        //             files: [response.data[0].text],
        //         });
        //     })

        //     .catch((err) => console.log(err));

        // }

    } else if (command == "breeds" || command == "breed") {
        
        //Simply return the list of suported breeds
        message.reply(`Breeds supported: \n\`\`\`\n${this._breeds.join('\n')}\`\`\``);
        return;

    } else if (command == "breads" || command == "bread") {

        // the Easter Egg, my gawd
        message.reply('', {
            files: [`https://www.thetoychronicle.com/wp-content/uploads/2016/05/Box-cat-Bread-cat-Rato-workroom-Kim-.jpg`],
        });

    } else if (command.includes("pic")){
        // lets the system know that pic has been determined

        command = command.replace("pic", "");
        var breed = "";
        var count = 1;

        if (command.includes("bomb")){
            //processes that the user wants 3 pictures
            count = 3;
            command = command.replace("bomb", "");
        }

        // determines that their was aditional text added on
        if (command.trim() != "") {

            //finds the breed
            const index = this._breeds.findIndex((curBreed) => {
                return command.includes(curBreed);
            })

            console.log(index)

            // checks if the bread was found or not
            if (index == -1) {
                message.reply(`I could not find that breed, take this instead.  Please type, "cat breed" to get a list of compatible breeds.`);
            } else {
                breed = `&breed_id=${this._breedsID[index]}`;
            }
        }
        
        //recieves the according info and posts, or derps
        await this.container.httpService
        .get(`${this._API_URL}images/search?limit=${count}${breed}`)
        .then((response: IHttpResponse) => {
            for (let index = 0; index < count; index++) {
                message.reply('', {
                    files: [response.data[index].url],
                });
            }
        })
        .catch((err) => console.log(err));
    }
  }

  // gets the commands and puts spaces between all words
  private _parseCommand(args: string[]): string {
    return args.map((str) => str.toLowerCase()).join(' ');
  }
}