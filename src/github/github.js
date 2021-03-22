import {info, error, setFailed, warning} from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { clean as semverClean, valid as semverValid } from 'semver';
import * as format from 'string-template';

let initialized = false;

export const github = {
	init() {
		if (initialized) {
			return;
		}
		const event = context.payload;
		if (context.eventName !== 'release') {
			setFailed(`Error. Incorrect event ${error.message}`);
			process.exit(1);
		}
		info(`Firing from ${context.eventName} on ${context.ref}`);

		if (!event.commits) {
			warning('No commits in event.');
		}
		initialized = true;
	},

	releaseData() {
		github.init();
		if (!context.payload.release) {
			throw new Error('Invalid payload data, release-data expected');
		}
		const tagName = context.payload.release.tag_name;
		const version = semverClean(tagName);
		return {
			tagName: tagName,
			fromBranch: context.payload.release.target_commitish,
			semVerTag: semverValid(version)
		};
	},

	async createPullRequest(head, base, props, ghConfig, dryRun) {
		const octokit = getOctokit(ghConfig.token);

		const owner = ghConfig.repoOwner;
		const repo = context.repo.repo;

		head = `${owner}:${head}`;

		const hasPR = !!(await octokit.pulls.list({owner, repo, head, base})).data.length;
		const isIdentical = (await octokit.repos.compareCommits({owner, repo, base, head})).data.status === "identical";

		if (hasPR) {
			warning(`Dont create a PR for ${head} into ${base}. PR already exists.`);
		} else if (isIdentical) {
			warning(`Dont create a PR for ${head} into ${base}. Branches are identical.`);
		} else {
			const titleBodyVars = {head, base};
			const labels = props.labels;

			if (dryRun) {
				info(`Dry-run... Not creating PR ${pr.number} - ${pr.title}`);
				return;
			}
			const pr = (await octokit.pulls.create({
				owner,
				repo,
				head: head,
				base: base,
				title: format(props.title, titleBodyVars),
				body: format(props.body, titleBodyVars),
			})).data;

			if(labels.length) {
				await octokit.issues.addLabels({
					owner,
					repo,
					issue_number: pr.number,
					labels
				});
			}

			info(`Created PR ${pr.number} - ${pr.title}`);
		}
	},
};
