# Contributing to Lion

## Branch names

Make sure that your branch names follow our naming scheme `author/feature_name`.
For example, `tanndlin/fixing_a_bug`, note that this is in snake case.

## Necessary extensions

Most of the developers for Lion use VSC, these extensions will help will following our code style guide.

This is not required but will help you get started.

1. Prettier
2. ESLint

## Github

Make sure to assign yourself to an issue when you start on it, or plan on taking it, so that we don't work on the same one.

For the most part, the admins will be merging the pull requests, but if your pull request reaches 2 approvals, then feel free to do so when you are ready.

Make sure to PR onto the `develop` branch as this one is always even or ahead of master. When we are ready to deploy, we will merge develop onto master so that the bot can auto redeploy

## Testing Lion

In order to test your code, you will need to set up a test server and [Discord Application](https://discord.com/developers/applications) to run Lion in. You can get the [UCF CS Discord Server](https://discord.gg/uXBmTd9) Template from one of our admins in the `#lion_project` channel.

**Note:** Lion is only designed to work in a **single** server at once, if your test bot is in any other server, Lion will not run, and that is an incredibly annoying bug to track down. So, it is recommended to make a separate test bot _specifically_ for testing Lion.

Once the bot is in your server, make sure to give it the `Chatbot` role in order for Lion to have the correct permission level.

After this is all complete `npm run watch` in your console will start up Lion, and it will be ready for testing.

## The Basics of Lion

Lion has 3 ways of interacting with a user

1. [Plugin](https://github.com/cs-discord-at-ucf/lion/blob/master/src/common/plugin.ts)

   1. Code that is triggered by a keyword given by a discord user.
   2. Each Plugin has 5 properties you need to fill in:

      1. `name`: The name that shows up when a user calls the [help plugin](https://github.com/cs-discord-at-ucf/lion/blob/master/src/app/plugins/help.plugin.ts).
      2. `description`: A string that tells the user what a plugin does when they call the help plugin.
      3. `usage`: A string that shows the user how to use your plugin.
      4. `pluginAlias`: An array of strings which serve as alternate names the user can call the plugin by.
      5. `permission`: The permission level of a channel this plugin is allowed to be called in. See [constants.ts](https://github.com/cs-discord-at-ucf/lion/blob/master/src/common/constants.ts) to see the various channels in each permission type.

   3. Each plugin also has 2 optional properties:

      1. `pluginChannelName`: This is the name of a channel that the plugin can only be used in. This overrides the `permission` field.
      2. `commandPattern`: A regex that is used to test a users input in order to [validate](https://github.com/cs-discord-at-ucf/lion/blob/622409e610a39211f45c3901ffb3ad6985181bc1/src/common/plugin.ts#L29-L35) the users input before calling execute. Without overriding `commandPattern` or `validate`, this will automatically return true and run execute, no matter what arguments (or lack thereof) a user gives to the plugin.

   4. [Example](https://github.com/cs-discord-at-ucf/lion/blob/master/src/app/plugins/8ball.plugin.ts)

2. Handler
   - Code that is triggered by an event given from the API
   - [Example](https://github.com/cs-discord-at-ucf/lion/blob/master/src/app/handlers/user_update.handler.ts)
3. [Job](https://github.com/cs-discord-at-ucf/lion/blob/master/src/common/job.ts)
   - Code that is run on a set interval
   - [Example](https://github.com/cs-discord-at-ucf/lion/blob/master/src/app/jobs/poll.job.ts)

The best place to start is a plugin. This is a simple as it gets, after following the instructions from the [readme](https://github.com/cs-discord-at-ucf/lion/blob/master/README.md), put whatever code you want to run in the `execute` function, and you will see that this code runs when a user calls this plugin.

## Variable names

1. All variable use camel case, except for constant values which are all uppercase spaced by underscores.
2. Private fields and methods on classes should start with an underscore. ie:

```ts
 public bar: number = 1
 private _foo: number = 0;

 public SOME_CONSTANT_STRING: string = 'Hello World!';
 private _ANOTHER_ONE: string = 'Goodbye World!';
```
