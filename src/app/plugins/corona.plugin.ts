import * as cheerio from 'cheerio';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage } from '../../common/types';
import { Util } from '../../common/util';

type Entry = {
  cases: number;
  deaths: number;
  recovered: number;
};

type Entries = {
  [name: string]: Entry;
};

export class CoronaPlugin extends Plugin {
  public name: string = 'Corona Plugin';
  public description: string = 'Track corona stats for you';
  public usage: string = '<state (optional)>';
  public permission: ChannelType = ChannelType.Public;
  public pluginChannelName: string = Constants.Channels.Public.Pandemic;

  private _URL: string = 'https://www.worldometers.info/coronavirus/country/us/';
  private _stats: Entries = {};
  constructor(public container: IContainer) {
    super();
  }

  private _transformRow(row: string[]): { key: string; value: Entry } {
    // Support both cases where state name is one and two words.
    const stateStats = row.map((r) => parseInt(r));
    const isTwoWordState = isNaN(parseInt(row[1]));
    let key = Util.toCamelCase(row[0]);
    let cases = stateStats[1];
    let deaths = stateStats[3];
    let activeCases = stateStats[5];

    if (isTwoWordState) {
      key = Util.toCamelCase(`${row[0]} ${row[1]}`);
      cases = stateStats[2];
      deaths = stateStats[4];
      activeCases = stateStats[6];
    }

    return {
      key,
      value: {
        cases,
        deaths,
        recovered: cases - activeCases,
      },
    };
  }

  public async doStuff(message: IMessage, args?: string[]): Promise<void> {
    message.reply('ok =');
    if (args) {
      const state = args[0].toLowerCase();
      if (!this._stats[state]) {
        // go fetch it
        const response = await this.container.httpService.get(this._URL);
        const $ = cheerio.load(response.data);
        const stateStats = $('#usa_table_countries_today > tbody:nth-child(2)');
        const rows = stateStats.find('tr').toArray();
        this._stats = rows.reduce((states: Entries, r) => {
          const transformedRow = this._transformRow(
            $(r)
              .text()
              .replace(/\n/g, '')
              .replace(/ {1,}/g, ' ')
              .split(' ')
              .filter((e) => e.length > 0)
          );

          states[transformedRow.key] = transformedRow.value;
          return states;
        }, {});
      }
    }
  }

  public async execute(message: IMessage, args?: string[]) {
    // we care about
    // - `!corona`
    // - `!corona florida`
    try {
      const response = await this.container.httpService.get(this._URL);
      console.log(response.data.length);
      const $ = cheerio.load(response.data);

      if (args && args.length === 1) {
        await this.doStuff(message, args);
        return;
      }
      const overallStats = $('#maincounter-wrap > div')
        .text()
        .trim()
        .split(' ')
        .reduce((acc: number[], element) => {
          const parsedElement = element.replace(/\s/g, '');
          if (parseInt(parsedElement) === 0 || parsedElement.length === 0) {
            return acc;
          }

          acc.push(parseInt(parsedElement));
          return acc;
        }, []);

      this._stats.all = {
        cases: overallStats[0],
        deaths: overallStats[1],
        recovered: overallStats[2],
      };

      message.reply(
        `Total cases: ${this._stats.all.cases}, Total deaths: ${this._stats.all.deaths}, Total recovered: ${this._stats.all.recovered}`
      );
      console.log(this._stats);
    } catch (e) {}
  }
}
