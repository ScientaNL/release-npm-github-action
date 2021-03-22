import { promises as fs } from "fs";
import {error as ghError} from '@actions/core';

/**
 * Reads the package manifest (package.json) and returns its parsed contents
 * @internal
 */
export async function readManifest(path) {
	let json, data;

	try {
		json = await fs.readFile(path, "utf-8");
	} catch (error) {
		ghError(error.message);
		throw new Error(`Unable to read manifest ${path}`);
	}

	try {
		data = JSON.parse(json);
	}
	catch (error) {
		ghError(error.message);
		throw new Error(`Unable to parse manifest ${path}`);
	}

	if (typeof data.name !== "string" || data.name.trim().length === 0) {
		throw new TypeError("Invalid package name");
	}

	return {
		name: data.name,
		version: data.version
	};
}
