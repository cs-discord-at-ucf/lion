import { ExamplePlugin } from './plugins/example.plugin';
import Environment from '../environment';

export class Bot {
  constructor() {
    this._build();
  }

  private _build(): void {
    const token = Environment.DiscordToken;
    console.log(token);
    // Obtain the Discord token.
    // Determine what environment we want to be in.
    // Load all plugins.
  }

  public run(): void {
    const plugin = new ExamplePlugin();
  }
}
