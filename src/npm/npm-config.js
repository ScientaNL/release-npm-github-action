import {execSync} from 'child_process';
import {promises as fs} from "fs";
import {EOL} from "os";
import {dirname} from "path";
import {error as ghError} from '@actions/core';
import {getNpmEnvironment} from "./npm-env";

/**
 * Sets/updates the NPM config based on the options.
 * @internal
 */
export async function setNpmConfig(options) {
	// Read the current NPM config
	let configPath = await getNpmConfigPath(options.token);
	let config = await readNpmConfig(configPath);

	// Update the config
	config = updateConfig(config, options.registry);

	// Save the new config
	await writeNpmConfig(configPath, config);
}

/**
 * Updates the given NPM config with the specified options.
 */
function updateConfig(config, registry) {
	let authDomain = registry.origin.slice(registry.protocol.length);

	let lines = config.split(/\r?\n/);

	// Remove any existing lines that set the registry or token
	lines = lines.filter((line) =>
		!(line.startsWith("registry=") || line.includes("_authToken=")) || line.includes('unsafe-perm')
	);

	// Append the new registry and token to the end of the file
	lines.push(`${authDomain}/:_authToken=\${INPUT_TOKEN}`);
	lines.push(`registry=${registry.href}`);
	lines.push(`unsafe-perm=true`);

	config = lines.join(EOL).trim() + EOL;

	return config;
}

/**
 * Gets the path of the NPM config file.
 */
function getNpmConfigPath(token) {
	try {
		// Get the environment variables to pass to NPM
		let env = getNpmEnvironment(token);

		let process = execSync("npm config get userconfig", { env: env });
		return process.toString().trim();
	}
	catch (error) {
		ghError(error.message);
		throw new Error("Unable to determine the NPM config file path.");
	}
}

/**
 * Reads the NPM config file.
 */
async function readNpmConfig(configPath) {
	try {
		return await fs.readFile(configPath, "utf-8");
	}
	catch (error) {
		if (error.code === "ENOENT") {
			return "";
		}
		ghError(error.message);
		throw new Error(`Unable to read the NPM config file: ${configPath}`);
	}
}

/**
 * Writes the NPM config file.
 */
async function writeNpmConfig(configPath, config) {
	try {
		await fs.mkdir(dirname(configPath), { recursive: true });
		await fs.writeFile(configPath, config);
	}
	catch (error) {
		ghError(error.message);
		throw new Error(`Unable to update the NPM config file: ${configPath}`);
	}
}
