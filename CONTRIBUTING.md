# Contributing to Lion

## Branch names

Make sure that your branch names follow our naming scheme `author/feature_name`.
For example, `tanndlin/fixing_a_bug`, note that this is in snake case.

## Necessary extensions

Most of the developers for Lion use VSC, these extensions will help will following our code style guide.

This is not required but will help you get started.

1. Prettier
2. ESLint

## Variable names

1. Camel Case
2. Private properties on classes should start with an underscore. ie: `private _foo: number = 0`, `public bar: number = 1`

## Github

Make sure to assign yourself to an issue when you start on it, or plan on taking it, so that we don't work on the same one.

## Testing Lion

In order to test your code, you will need to set up a test server and [Discord Application](https://discord.com/developers/applications) to run Lion in. You can get the [UCF CS Discord Server](https://discord.gg/uXBmTd9) Template from one of our admins in the `#lion_project` channel.

**Note:** Lion is only designed to work in a **single** server at once, if your test bot is in any other server, Lion will not run, and that is an incredibly annoying bug to track down. So, it is recommended to make a separate test bot _specifically_ for testing Lion.

Once the bot is in your server, make sure to give it the `Chatbot` role in order for Lion to have the correct permission level.

After this is all complete `npm run watch` in your console will start up Lion, and it will be ready for testing.
