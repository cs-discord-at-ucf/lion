import CheckClassesPlugin from '../app/plugins/checkclasses.plugin';
import { getContainerMock } from '../__mocks__';
import { Moderation } from '../services/moderation.service';

describe('CheckClasses Arg Tests', () => {
  test('Name with no spaces', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'Tanndlin#4450';

    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('Name with spaces', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'Tanndlin Test#6270';

    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('ID as handle', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = '97478270424985600';

    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('ID with suffix should be false', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = '97478270424985600 hello';

    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeFalsy();
  });

  test('ID with prefix should be false', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    const input = 'hello 97478270424985600';

    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeFalsy();
  });

  test('ID as empty string', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    let test = Moderation.Helpers.validateUser("")
    expect(test).toBeFalsy();

  });
  test('ID as 18 char handle', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    let test = Moderation.Helpers.validateUser("123456789012345678")
    expect(test).toBeTruthy();

  });
  test('ID as 13 char + #1234', () => {
    const plugin = new CheckClassesPlugin(getContainerMock());
    let test = Moderation.Helpers.validateUser("1234567890123#1234")
    expect(test).toBeTruthy();

  });
});
