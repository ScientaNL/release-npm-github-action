/**
 * Returns the environment variables that should be passed to NPM, based on the given options.
 */
export function getNpmEnvironment(token) {
	let env = {
		// Copy all the host's environment variables
		...process.env,

		// Don't pass Node.js runtime variables to NPM
		NODE_ENV: "",
		NODE_OPTIONS: "",
	};

	// Determine if we need to set the NPM token
	let needsToken = Boolean(token && process.env.INPUT_TOKEN !== token);

	if (needsToken) {
		env.INPUT_TOKEN = token;
	}

	return env;
}
