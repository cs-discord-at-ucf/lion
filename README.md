## ![A lion with a crown and the text lion](https://i.imgur.com/AX8My57.png)

Lion is a **plugin-oriented** [Discord](https://discordapp.com/) bot that utilizes Discord.js and TypeScript. Lion was created originally to satisfy the needs of server automation within the [UCF CS Discord](https://discord.gg/ucf-cs-ece-it).

# Getting Started

The simplest way to get started off with developing the Lion codebase is by cloning the project:
`git clone https://github.com/cs-discord-at-ucf/lion.git`

Install dependencies via NPM:
`npm install`

Create a Discord Bot in the [Discord Developer Portal](https://discord.com/developers/applications). Make sure that your bot has the "Server Members Intent" enabled.

Create a `.env` file within the root directory of the project (reference the `.env.sample` sample file) with your Discord application token:
`DISCORD_TOKEN=your_token_here`

Execute the following command to launch Lion:
`npm run watch`

All subsequent saved changes made within the `/src` directory will make Lion automatically rebuild while the `watch` command is running.

## Your first plugin

Navigate to the `/src/app/plugins` directory and create a new file following the specific schema:
`example.plugin.ts`

For ease of use, it's recommended that your plugin name is in all lowercase and in snake_case.

**Your plugin must be the _default_ export of the file: e.g. `export default class ExamplePlugin`**

Here's a skeleton for how a basic plugin should look:

```typescript
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export default class ExamplePlugin extends Plugin {
  public commandName: string = 'example';
  public name: string = 'Example Plugin';
  public description: string = 'An example plugin to show how awesome Lion is!';
  public usage: string = 'example';
  public permission: ChannelType = ChannelType.Bot;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    // Your logic here.
  }
}
```

Again, this is a basic skeleton. It is suggested to read the abstract `Plugin` class to fully know what is possible within a plugin, which is located in `/src/common/plugin.ts`.

And that's it! You have successfully created your first plugin with Lion!
