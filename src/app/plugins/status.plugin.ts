import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { PluginStore } from '../../bootstrap/plugin.loader';
import { RichEmbed } from 'discord.js';

export class StatusPlugin extends Plugin {
  public name: string = 'Status';
  public description: string = 'Gets info about Lion';
  public usage: string = 'status';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  private LION_PFP_LIN: string =
    'https://cdn.discordapp.com/avatars/574623716638720000/7d404c72a6fccb4a3bc610490f8d7b72.png';
  private REPO_LINK = 'https://github.com/joey-colon/lion/commit/';

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length === 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const latestCommit = await Promise.resolve(this._getLatestCommit());
    const numPluigins = Object.keys(PluginStore).length;
    const uptime = this._getUptime();

    const embed = this._creatEmbed(latestCommit, numPluigins, uptime);
    message.reply(embed);
  }

  private _creatEmbed(latestCommit: any, numPluigins: number, uptime: number) {
    const commitLink = this.REPO_LINK + latestCommit?.number;

    const embed = new RichEmbed();
    embed.setTitle('Lion Status');
    embed.setColor('#1fe609');
    embed.setThumbnail(this.LION_PFP_LIN);
    embed.setURL(commitLink);

    embed.addField('Latest Commit Hash', latestCommit?.number, true);
    embed.addField('Latest Commit Author', latestCommit?.author, true);
    embed.addField('Latest Commit Date', latestCommit?.date, true);
    embed.addField('Number Of Plugins', numPluigins, true);
    embed.addField('Uptime', this._msToTime(uptime), true);

    return embed;
  }

  //https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
  private _msToTime(duration: number) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    // hours = hours < 10 ? '0' + hours : hours;
    // minutes = minutes < 10 ? '0' + minutes : minutes;
    // seconds = seconds < 10 ? '0' + seconds : seconds;

    return hours + ':' + minutes + ':' + seconds;
  }

  //Returns uptime in ms
  private _getUptime() {
    const startTime = this.container.clientService.getStartTime();
    const elapsedTime = Date.now() - startTime;
    return elapsedTime;
  }

  private async _getLatestCommit() {
    const result = (await this._execute('git log')) as string;
    const commits = result.split('commit').slice(1); //First element is an empty string
    const latestCommit = this._parseCommit(commits[0]);

    return latestCommit;
  }

  //Returns object containing [commitNumber, author, date]
  private async _parseCommit(data: string) {
    const parsedData = data.split('\n').filter((e) => e != '');
    const [commitNumber, author, date, ...commits] = parsedData;
    const usernameRegex: RegExp = / [a-zA-Z0-9]+ /;

    const authorMatch = author.match(usernameRegex);
    if (!authorMatch) {
      return;
    }

    const shortCommitId = await this._execute(`git rev-parse --short ${commitNumber.trim()}`);
    const parsedAuthor = authorMatch[0].trim();
    const parsedCommits = commits.map((e) => e.trim());
    const parsedDate = date
      .split('   ')[1]
      .split(' ')
      .slice(0, 5)
      .join(' '); //the data looks like this 'Date:   Fri Nov 6 15:06:38 2020 -0500'

    const commitData = {
      number: shortCommitId,
      author: parsedAuthor,
      date: parsedDate,
      commits: parsedCommits,
    };

    return commitData;
  }

  private _execute(command: string) {
    const { exec } = require('child_process');
    return new Promise(function(resolve, reject) {
      exec(command, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(stderr);
          return;
        }

        resolve(stdout.trim());
      });
    });
  }
}
