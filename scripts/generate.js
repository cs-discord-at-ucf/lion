#!/usr/bin/env node
const fs = require('fs/promises');

const buildPluginContent = (pluginName) =>
  `import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class ${pluginName} extends Plugin {
  public name: string = '${pluginName}';
  public description: string = 'Some sort of a description.';
  public usage: string = '${pluginName}';
  public permission: ChannelType = ChannelType.Public;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args?: string[]) {
    // Your logic here.
  }
}
`;

const buildPluginFriendlyName = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((token) => `${token.substr(0, 1).toUpperCase()}${token.substr(1)}`)
    .join('')
    .concat('Plugin');

const buildPluginLoader = (pluginLoader, pluginName, fileName) => {
  const tokens = pluginLoader.split('\n');
  const desiredIdx = tokens.findIndex((r) => r.length === 0);
  tokens.splice(
    desiredIdx,
    0,
    `import { ${pluginName} } from '../app/plugins/${fileName}.plugin';`
  );
  return tokens.join('\n').replace(
    `};`,

    `  ${pluginName.toLowerCase().substr(0, pluginName.length - 6)}: ${pluginName},
};`
  );
};

const createPlugin = async (name) => {
  const sanitizedName = name.toLowerCase().replace(/ /g, '_');
  const cwd = process.cwd();
  const pluginDirectoryPath = `${cwd}/src/app/plugins`;
  const newPluginPath = `${pluginDirectoryPath}/${sanitizedName}.plugin.ts`;
  const newPluginName = buildPluginFriendlyName(name);
  const newPluginContent = buildPluginContent(newPluginName);

  await fs.writeFile(newPluginPath, newPluginContent);

  const pluginLoaderPath = `${cwd}/src/bootstrap/plugin.loader.ts`;
  const pluginLoaderContent = await fs.readFile(pluginLoaderPath, 'utf-8');
  const newPluginLoaderContent = buildPluginLoader(
    pluginLoaderContent,
    newPluginName,
    sanitizedName
  );

  await fs.writeFile(pluginLoaderPath, newPluginLoaderContent);
};

const action = process.argv[3];
const name = process.argv.slice(4).join(' ');

if (action !== 'plugin') {
  console.error('Invalid action name.');
  return -1;
}

if (!name) {
  console.error('No name specified.');
  return -1;
}

createPlugin(name)
  .then(() => console.log('✅  Added Plugin'))
  .catch((err) => console.error(`❌  Something went wrong: ${err}`));
