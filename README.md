# release-npm-github-action
This Github action releases a new version of an NPM package whenever a new release is done on Github.

#### After a Github release is made, this action will;
- Commit to your repository, updating the package.json
- Release a new version of an npm package using npm publish

#### Example configuration
```yaml
name: Create release
on:
  release:
    types: [ created ]
jobs:
  npm-version-publish:
    name: NPM publish locking-cache
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: NPM version release
        uses: ScientaNL/release-npm-github-action@1.2.0
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
          npm-token: "${{ secrets.NPM_SCIENTA_TOKEN }}"
          repository-owner: "ScientaNL"
          npm-options: "{tag: 'latest', access: 'public'}"
```
see https://docs.npmjs.com/cli/v6/commands/npm-publish for more information.
