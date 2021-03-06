import {info} from "@actions/core";
import {execSync} from "child_process";

export const git = {
	configure(options, remoteSlug) {
		remoteSlug = remoteSlug || 'origin';
		info(`Setting git user to ${options.gitUserName}`);
		execSync(`git config user.name ${options.gitUserName}`);

		info(`Setting git email to ${options.gitUserEmail}`);
		execSync(`git config user.email "${options.gitUserEmail}"`);

		info(`Setting git remote [${remoteSlug}] to ${options.remoteRepo}`);
		execSync(`git remote set-url origin ${options.remoteRepo}`);

		return remoteSlug;
	},

	addAndCommit(files, message) {
		message = message.trim().replace(/["]/g, "");
		const filesString = files.join(' ');

		info(`Checking status of files files: ${filesString}`);
		const gitStatus = execSync(`git status -s ${filesString}`).toString();

		if (!gitStatus) {
			return false;
		}

		info(`Adding and committing files: ${filesString}`);
		execSync(`git add ${filesString}`);
		execSync(`git commit -m"${message}"`);

		return execSync(`git log --name-status HEAD^..HEAD`).toString();
	},

	tagHead(tagName, message) {
		message = message.trim().replace(/["]/g, "");
		info(`Tagging ${tagName}`);
		execSync(`git tag -fa ${tagName} -m "${message}"`);
	},

	deleteTag(remote, refSpec, dryRun) {
		const cmd = ['git', 'push', '--delete'];

		if (dryRun) {
			cmd.push('--dry-run');
		}

		cmd.push(remote);
		cmd.push(refSpec);

		info(`Deleting tag ref ${refSpec} from ${remote}`);
		execSync(cmd.join(' '));
	},

	push(remote, refSpec, force, dryRun) {
		const cmd = ['git', 'push', '-v'];

		if (force) {
			cmd.push('--force');
		}

		if (dryRun) {
			cmd.push('--dry-run');
		}

		cmd.push(remote);
		cmd.push(refSpec);

		info(`Pushing ref ${refSpec} to ${remote}`);
		execSync(cmd.join(' '));
	},
};
