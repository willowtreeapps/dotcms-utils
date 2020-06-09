# dotcms-utils

CLI and utilities library for interacting with dotCMS.

## Usage

```bash
# Install globally
npm i -g @willowtreeapps/dotcms-utils

# See all available options
dotcms-utils

# Step through initialization of dotcms.config.json
dotcms-utils init
```

### `dotcms.config.json`

Contains dotCMS-related configuration used by dotcms-utils.

**This file should NOT be checked in to source control.** Plaintext credentials may be stored in this file so it's best to avoid keeping it in revision history. Instead, consider sharing it only with project contributors who require it.

### Commands

#### init

Initialize a new dotCMS target to be used by other `dotcms-utils` commands.

```bash
dotcms-utils init
```

After following instructions, `dotcms.config.json` will either be created or updated in your project's root directory.

#### config

Print contents of `dotcms.config.json`.

```bash
dotcms-utils config
```

#### token

Generate an API access token for a dotCMS target.

```bash
dotcms-utils token <target>

# Print existing token in prod target configuration
dotcms-utils token prod

# Create new token and save it in configuration
dotcms-utils token prod --create --save --label "CI token" --expiration 365
```

#### bundle-diff

Generate the diff of a bundle between two dotCMS targets. By default, outputs to `diff.html` in the current working directory.

```bash
dotcms-utils bundle-diff <src> <dest> <bundleId>

# Diff a release bundle from non-prod against prod.
dotcms-utils bundle-diff nonprod prod 2DOT8
```

## Contributing

Please read through open issues to find ideas for contributing. Code additions are welcome through pull requests.

### Guidelines

- Use the REST API with API access keys wherever possible.
- Prefer using the [dotcms npm module](https://www.npmjs.com/package/dotcms) instead of directly using `fetch`.
- Use [Angular commit message syntax.](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)
  ```
  <type>(<scope>): <subject>
  <BLANK LINE>
  <body>
  <BLANK LINE>
  <footer>
  ```
  ```
  feat(deploy): recursively create non-existent directories
  ```
