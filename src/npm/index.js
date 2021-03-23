import {execSync} from "child_process";
import {promises as fs, existsSync} from "fs";
import {dirname, resolve} from "path";
import {gte as semverGte} from "semver";
import {error as ghError, info} from "@actions/core";
import {setNpmConfig} from "./npm-config";
import {getNpmEnvironment} from "./npm-env";
import {readManifest} from "./read-manifest";

/**
 * Runs NPM commands.
 * @internal
 */
export const npm = {
	/**
	 * Publishes the specified package to NPM
	 */
	async version(newVersion, options) {
		// Update the NPM config with the specified registry and token
		await setNpmConfig(options);

		const packageData = await readManifest(options.packageJson);
		if (!semverGte(newVersion, packageData.version)) {
			throw new Error(`New version ${newVersion} not equal or greater than current version ${packageData.version}`);
		}

		// Run "npm version" in the package.json directory
		let cwd = resolve(dirname(options.packageJson));

		try {
			info(`Updating npm package version to ${newVersion}`);
			const cmd = ['npm', '--no-git-tag-version', '--allow-same-version', 'version', newVersion];

			// Get the environment variables to pass to NPM
			let env = getNpmEnvironment(options.token);

			execSync(cmd.join(' '), {
				cwd: cwd,
				env: env
			});
		} catch (error) {
			ghError(error.message);
			throw new Error(`Unable to update ${packageData.name} version to ${newVersion}.`);
		}

		const files = [];
		for (let file of [`package.json`, `package-lock.json`, `npm-shrinkwrap.json`]) {
			file = `${cwd}/${file}`;
			if (existsSync(file)) {
				files.push(file);
			}
		}
		return files;
	},


	/**
	 * Publishes the specified package to NPM
	 */
	async publish(version, options) {
		// Update the NPM config with the specified registry and token
		await setNpmConfig(options);

		try {
			info(`Publishing npm package version ${version}`);
			const cmd = ['npm', 'publish'];

			if (options.tag !== 'latest') {
				cmd.push("--tag", options.tag);
			}

			if (options.access) {
				cmd.push("--access", options.access);
			}

			if (options.dryRun) {
				cmd.push("--dry-run");
			}

			// Get the environment variables to pass to NPM
			let env = getNpmEnvironment(options.token);

			// Run "npm publish" in the package.json directory
			let cwd = resolve(dirname(options.packageJson));

			execSync(cmd.join(' '), {
				cwd: cwd,
				env: env
			});
		} catch (error) {
			ghError(error.message);
			throw new Error(`Unable to publish ${version} to NPM.`);
		}
	},
};
