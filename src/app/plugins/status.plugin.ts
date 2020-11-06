import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { PluginStore } from '../../bootstrap/plugin.loader';

export class StatusPlugin extends Plugin {
  public name: string = 'Status';
  public description: string = 'Gets info about Lion';
  public usage: string = 'status';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args && args.length == 0;
  }

  public async execute(message: IMessage, args: string[]) {
    const latestCommit = await Promise.resolve(this._getLatestCommit());
    const numPluigins = Object.keys(PluginStore).length;
    const uptime = this._getUptime();
    console.log(latestCommit);
    console.log(numPluigins);
    console.log(uptime);
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
  private _parseCommit(data: string) {
    const parsedData = data.split('\n').filter((e) => e != '');
    const [commitNumber, author, date, ...commits] = parsedData;
    const usernameRegex: RegExp = / [a-zA-Z0-9]+ /;

    const authorMatch = author.match(usernameRegex);
    if (!authorMatch) {
      return;
    }

    const parsedAuthor = authorMatch[0].trim();
    const parsedCommits = commits.map((e) => e.trim());

    const commitData = {
      number: commitNumber.trim(),
      author: parsedAuthor,
      date: date.split('   ')[1], //the data looks like this 'Date:   Fri Nov...'
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
