# Testing Guide for TineX

This guide explains how to run and write tests for the TineX project.

## Prerequisites

All testing dependencies are already installed. The project uses:
- **Jest** - Testing framework
- **@testing-library/react** - For React component testing (future use)
- **@testing-library/jest-dom** - Custom Jest matchers

## Running Tests

### Command Line

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### VSCode

#### Method 1: Using Terminal
1. Open the integrated terminal in VSCode (`Ctrl+` ` or `Cmd+` `)
2. Run any of the test commands above

#### Method 2: Using Jest Extension (Recommended)
1. Install the **Jest** extension by Orta
   - Open Extensions (`Cmd+Shift+X` or `Ctrl+Shift+X`)
   - Search for "Jest" by Orta
   - Click Install

2. After installation:
   - Tests will automatically run in the background
   - You'll see green checkmarks ✓ or red X marks next to test cases
   - Click the checkmark/X to see test results
   - You can run individual tests by clicking the "Run" button that appears above each test

3. View test results:
   - Open the "Testing" sidebar (`Cmd+Shift+T` or `Ctrl+Shift+T`)
   - See all tests organized by file
   - Click any test to run it individually

#### Method 3: Using Debug Configuration
1. Click the Debug icon in the sidebar (or `Cmd+Shift+D`)
2. Click "create a launch.json file"
3. Select "Node.js"
4. Add this configuration to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Run All Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Run Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

5. Set breakpoints in your test files
6. Run the debug configuration

## Test Structure

Tests are located in the `__tests__` directory, mirroring the project structure:

```
__tests__/
├── api/
│   └── parse-pdf.test.ts       # Tests for PDF parsing API route
└── services/
    └── trusteeParser.test.ts   # Tests for Trustee PDF parser
```

## Current Tests

### Trustee Parser Tests (`__tests__/services/trusteeParser.test.ts`)

Tests the PDF parsing functionality:
- ✓ Parses PDF without errors
- ✓ Extracts period information
- ✓ Extracts card number
- ✓ Parses transactions with correct structure
- ✓ Amounts are positive numbers
- ✓ Correctly identifies income vs expense
- ✓ Creates unique hashes for duplicate detection
- ✓ Parses valid currency codes
- ✓ Handles PDF buffers correctly
- ✓ Rejects invalid buffers

### Parse PDF API Tests (`__tests__/api/parse-pdf.test.ts`)

Tests the `/api/parse-pdf` endpoint:
- ✓ Accepts PDF and returns parsed transactions
- ✓ Returns 400 if no file provided
- ✓ Returns 500 if invalid PDF provided
- ✓ Serializes dates correctly for JSON

## Writing New Tests

### Test File Naming
- Place tests in `__tests__` directory
- Name files with `.test.ts` or `.test.tsx` extension
- Mirror the structure of your source files

### Example Test Structure

```typescript
import { describe, test, expect } from '@jest/globals';

describe('Feature Name', () => {
  test('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   - Arrange: Set up test data
   - Act: Execute the code being tested
   - Assert: Verify the results

2. **Descriptive Names**: Use clear, descriptive test names
   - Good: `should parse transactions with correct structure`
   - Bad: `test1`

3. **One Assertion Per Test**: Focus each test on one thing
   - Makes debugging easier
   - Makes test intent clearer

4. **Use Console Logs Sparingly**: Only log useful debugging info
   - Helps understand what the test is checking
   - Don't overdo it

## Debugging Tests

### View Detailed Output
```bash
npm test -- --verbose
```

### Run a Single Test File
```bash
npm test -- trusteeParser.test.ts
```

### Run Tests Matching a Pattern
```bash
npm test -- --testNamePattern="should parse"
```

### Run Tests with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome and navigate to `chrome://inspect`

## Coverage Reports

After running `npm run test:coverage`, view the coverage report:
- Terminal: Shows summary
- HTML Report: Open `coverage/lcov-report/index.html` in browser

## CI/CD Integration

To add tests to your CI/CD pipeline, add this to your workflow:

```yaml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests Fail with "Cannot find module"
- Run `npm install`
- Check that paths in `jest.config.js` are correct

### PDF Parsing Tests Fail
- Ensure `trustee_statement.pdf` exists in project root
- Check file permissions

### TypeScript Errors in Tests
- Run `npm run type-check` to see all errors
- Check that types are imported correctly

## Next Steps

1. Add tests for other parsers (Monobank, etc.)
2. Add tests for repositories
3. Add React component tests
4. Set up continuous integration
5. Add test coverage requirements

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
