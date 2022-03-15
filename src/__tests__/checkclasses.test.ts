import CheckClassesPlugin from '../app/plugins/checkclasses.plugin';
import { getContainerMock } from '../__mocks__';

describe('CheckClasses Arg Tests', () => {
  test('Name with no spaces', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'Tanndlin#4450';

    const test = plugin.commandPattern.test(input);
    expect(test).toBeTruthy();
  });

  test('Name with spaces', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'Tanndlin Test#6270';

    const test = plugin.commandPattern.test(input);
    expect(test).toBeTruthy();
  });

  test('ID as handle', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = '97478270424985600';

    const test = plugin.commandPattern.test(input);
    expect(test).toBeTruthy();
  });

  test('ID with suffix should be false', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = '97478270424985600 hello';

    const test = plugin.commandPattern.test(input);
    expect(test).toBeFalsy();
  });

  test('ID with prefix should be false', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'hello 97478270424985600';

    const test = plugin.commandPattern.test(input);
    expect(test).toBeFalsy();
  });
});
