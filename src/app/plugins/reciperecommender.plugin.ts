import axios from 'axios';
import { MessageEmbed } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';

export default class RecipeRecommenderPlugin extends Plugin {
  public commandName: string = 'reciperecommender';
  public name: string = 'Recipe Recommender';
  public description: string =
  'Recommends a random recipe from http://whatthefuckshouldimakefordinner.com/ or its vegetarian counterpart, given the optional argument.';
  public usage: string = 'recrec <veg>?';
  public permission: ChannelType = ChannelType.Public;
  public pluginAlias: string[] = ['recrec', 'rr', 'reciperecommender'];
  public pluginChannelName = Constants.Channels.Public.Food;

  private static readonly _API_URL = 'http://whatthefuckshouldimakefordinner.com/';
  private static readonly _RECIPE_NAME_REGEX = /\>(.*?)\</g;
  private static readonly _IMAGE_PREVIEW_REGEX = /<meta.*property="og:image".*content="(.*)".*\/>/;
  private static readonly _URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&/=]*)/;
  private static readonly _AUTHOR_IMAGE_URL = 'https://i.imgur.com/B2vwvFL.png';

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const wantsVeg = args[0] === 'veg';
    const API_URL = RecipeRecommenderPlugin._API_URL + (wantsVeg ? 'veg.php' : '');
    const res = await axios.get(API_URL);
    if (!res || res.status !== 200) {
      await message.channel.send('Sorry, the API is down.');
      return;
    }

    // response page is always the same so we just take a specific line from the HTML response
    // based on wantsVeg, which changes the api endpoint used
    const scrapedRecipe: string = res.data.split('\n')[wantsVeg ? 23 : 21];
    const [recipeURL] = scrapedRecipe.match(RecipeRecommenderPlugin._URL_REGEX)!;
    // scrapes <meta content="og:image"> from recipie website
    const [, previewImageURL] = (await axios.get(recipeURL)).data.match(RecipeRecommenderPlugin._IMAGE_PREVIEW_REGEX);
    const [, uglyRecipeName] = scrapedRecipe.match(RecipeRecommenderPlugin._RECIPE_NAME_REGEX)!;
    const recipeName = uglyRecipeName.substring(1, uglyRecipeName.length - 1);

    const embed = new MessageEmbed()
      .setAuthor('What the f*** should I make today?', RecipeRecommenderPlugin._AUTHOR_IMAGE_URL, API_URL)
      .setTitle(recipeName)
      .setURL(recipeURL)
      .setImage(previewImageURL ?? '');

    message.channel.send(embed);
  }
}
