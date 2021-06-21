# Lion Tester

## Setup

1. Make sure that the `TESTER_TOKEN` field is filled in with a **separate** token, and that the associated bot is in your test server (and **only** your test server).
2. Run the command `git update-index --assume-unchanged .\src\test\bootstrap\tester.loader.ts` if your `tester.loader.ts` file is showing up in `git status` after making changes.

## Adding Test Cases

1. Create a file following the format of `example.tester.ts` under the `src/test/testCases` folder.
2. Add that file to the `CASES` array in `tester.loader.ts`. ie:

```ts
import { ExampleTester } from '../testCases/example.tester';

// Put Instantiated Test Case Classes In Here
export const CASES = [new ExampleTester()];
```

## Running The Tester

In a separate terminal, run the command `npm run test`, your test bot should start up, send out your test cases, and exit cleanly. Note that you also need to have Lion running in another terminal.
