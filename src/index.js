import {
	getInput, setFailed, warning, startGroup, endGroup
} from '@actions/core';
import { context } from '@actions/github';
import { parse as parseJson } from 'json5';
import {git, github} from './github';
import {npm} from './npm';

const dryRun = Boolean(getInput('dry-run'));
const githubToken = getInput('github-token');
const npmToken = getInput('npm-token') ?? '';
const githubUsername = getInput('github-username');
const githubRepoOwner = getInput('repository-owner') || context.repo.owner;
const options = {
	dryRun: dryRun,
	npm: {
		tag: 'latest',
		dryRun: dryRun,
		access: null,
		token: null,
		registry: 'https://registry.npmjs.org/',
		packageJson: getInput('package-json')
	},
	git: {
		gitUserName: getInput('github-user-name') || `github-actions[bot]`,
		gitUserEmail: getInput('github-user-email') || `41898282+github-actions[bot]@users.noreply.github.com`,
		remoteRepo: `https://${githubUsername}:${githubToken}@github.com/${githubRepoOwner}/${context.repo.repo}.git`,
	},
	github: {
		token: githubToken,
		userName: githubUsername,
		repoOwner: githubRepoOwner,
		pushOrPRChanges: getInput('push-or-pr-changes') === 'push' ? 'push' : 'pr',
		pullRequest: {
			title: getInput('pr-title') || 'Merge {head} into {base}',
			body: getInput('pr-body') || 'PR automatically created by release-npm Github Action',
			labels: [ 'release-npm' ]
		}
	}
};

try {
	const npmOptions = parseJson(getInput('npm-options'));
	options.npm = { ...options.npm, ...npmOptions };
	options.npm.registry = new URL(options.npm.registry);
	options.npm.token = npmToken.trim();
	if (!options.npm.token.length) {
		throw new Error('a valid npm token must be present');
	}
} catch (error) {
	setFailed(`Failed to parse jsonOpts ${error.message}`);
	process.exit(1);
}

try {
	const prLabelsInput = getInput('pr-labels');
	if (prLabelsInput) {
		const prLabels = parseJson(prLabelsInput);
		if (!Array.isArray(prLabels)) {
			throw new Error('pr-labels input must be an array-string');
		}
		options.github.pullRequest.labels = [...options.github.pullRequest.labels, ...prLabels];
	}
} catch (error) {
	setFailed(`Failed to parse pr-labels ${error.message}`);
	process.exit(1);
}

(async () => {
	try {
		startGroup('Git configuration');
		const gitRemote = git.configure(options.git);
		endGroup();


		startGroup('Validate tag version');
		const releaseData = github.releaseData();
		if (!releaseData.semVerTag) {
			warning('Invalid semver tag, not creating npm-version.');
			process.exit(0);
		}
		endGroup();


		startGroup(`Creating new npm version for tag ${releaseData.semVerTag}`);
		const files = await npm.version(releaseData.semVerTag, options.npm);
		endGroup();


		startGroup(`Committing back versioned files into github release ${releaseData.semVerTag}`);
		git.addAndCommit(files, `release-npm, bump version to ${releaseData.semVerTag}`);
		git.tagHead(releaseData.tagName, `release-npm, release version ${releaseData.semVerTag}`);
		git.push(gitRemote, releaseData.tagName, true, options.dryRun);

		if (options.github.pushOrPRChanges === 'push') {
			git.push(gitRemote,  `HEAD:${releaseData.fromBranch}`, true, options.dryRun);
		} else {
			await github.createPullRequest(releaseData.tagName, releaseData.fromBranch, options.github, options.dryRun);
		}
		endGroup();


		startGroup(`Publishing npm package ${release.semVerTag}`);
		await npm.publish(releaseData.semVerTag, options.npm);
		endGroup();
	} catch (error) {
		setFailed(error.message);
	}
})();
