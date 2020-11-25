import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { PLUGIN_STORE_SIZE } from '../../bootstrap/plugin.loader';
import { RichEmbed } from 'discord.js';

export class StatusPlugin extends Plugin {
  public name: string = 'Status';
  public description: string = 'Gets info about Lion';
  public usage: string = 'status';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private LION_PFP_URL: string =
    'https://cdn.discordapp.com/avatars/574623716638720000/7d404c72a6fccb4a3bc610490f8d7b72.png';
  private REPO_URL = 'https://github.com/joey-colon/lion/commit/';

  private HASH_LOCATOR: string = 'sha user-select-contain';
  private AUTHOR_LOCATOR: string = 'View all commits by';
  private DATE_LOCATOR: string = 'relative-time';

  private HASH_REGEX: RegExp = />[a-zA-Z0-9]{40}</;
  private AUTHOR_REGEX: RegExp = />.+</;
  private DATE_REGEX: RegExp = />[\s\w,.]+</;

  private _SMALL_HASH_LENGTH: number = 'b4b28e'.length;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length === 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const latestCommit = await this._getLatestCommit();
    const numPluigins = PLUGIN_STORE_SIZE;
    const uptime = this._getUptime();

    const embed = this._creatEmbed(latestCommit, numPluigins, uptime);
    message.reply(embed);
  }

  private _creatEmbed(latestCommit: any, numPluigins: number, startDate: string) {
    const commitLink = this.REPO_URL + latestCommit?.hash;

    const embed = new RichEmbed();
    embed.setTitle('Lion Status');
    embed.setColor('#1fe609');
    embed.setThumbnail(this.LION_PFP_URL);
    embed.setURL(commitLink);

    embed.addField('Latest Commit Hash', latestCommit?.hash, true);
    embed.addField('Latest Commit Author', latestCommit?.author, true);
    embed.addField('Latest Commit Date', latestCommit?.date, true);
    embed.addField('Number Of Plugins', numPluigins, true);
    embed.addField('Uptime', startDate, true);

    return embed;
  }

  private _getUptime() {
    const startDate: Date = this.container.clientService.getStartDate();
    const currentDate: Date = new Date();

    const days = currentDate.getDay() - startDate.getDay();
    const hours = currentDate.getHours() - startDate.getHours();
    const minutes = currentDate.getMinutes() - startDate.getMinutes();
    const seconds = currentDate.getSeconds() - startDate.getSeconds();

    return `${days}:${hours}:${minutes}:${seconds}`;
  }

  private async _getLatestCommit() {
    const response = await this.container.httpService.get(`${this.REPO_URL}master/`);
    const data: string[] = response.data.split('\n');

    const longHash = this._parseData(data, this.HASH_LOCATOR, this.HASH_REGEX);
    const author = this._parseData(data, this.AUTHOR_LOCATOR, this.AUTHOR_REGEX);
    const date = this._parseData(data, this.DATE_LOCATOR, this.DATE_REGEX);

    const shortHash = longHash.slice(0, this._SMALL_HASH_LENGTH);
    return { hash: shortHash, author: author, date: date };
  }

  private _parseData(data: string[], locator: string, reg: RegExp): string {
    const [container] = data.filter((e) => e.includes(locator));
    const matches = container.match(reg);
    if (!matches) {
      return '';
    }

    const [parsedData] = matches;
    return parsedData.slice(1, parsedData.length - 1); //Data looks like this ">dataHere<" due to regex
  }
}
