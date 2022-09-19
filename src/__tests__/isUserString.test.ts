import { Moderation } from '../services/moderation.service';

describe('Moderation Helper Method for User ID Validation', () => {
  test('Name with no spaces', () => {
    const input = 'Tanndlin#4450';
    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('Name with spaces', () => {
    const input = 'Tanndlin Test#6270';
    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('ID as handle', () => {
    const input = '97478270424985600';
    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeTruthy();
  });

  test('ID with suffix should be false', () => {
    const input = '97478270424985600 hello';
    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeFalsy();
  });

  test('ID with prefix should be false', () => {
    const input = 'hello 97478270424985600';
    const test = Moderation.Helpers.validateUser(input);
    expect(test).toBeFalsy();
  });

  test('ID as empty string', () => {
    const test = Moderation.Helpers.validateUser('');
    expect(test).toBeFalsy();

  });
  
  test('ID as 18 char handle', () => {
    const test = Moderation.Helpers.validateUser('123456789012345678');
    expect(test).toBeTruthy();
  });

  test('ID as 13 char + #1234', () => {
    const test = Moderation.Helpers.validateUser('1234567890123#1234');
    expect(test).toBeTruthy();
  });
});
