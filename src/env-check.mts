
// define environment variables and types
const envVars = [

    'DB_APP_USER',
    'DB_APP_PASS',

    'APP_IP',
    'DB_IP',
    'HTTP_PORT',
    'DB_PORT',

    'NODE_ENV'

] as const;
type EnvVars = {
    [key in typeof envVars[number]]: string;
}

// export function to check environment variables
export default function checkEnvVars(env: NodeJS.ProcessEnv): env is EnvVars {
    for (const envVar of envVars)
        if (env[envVar] === undefined)
            return false;
    return true;
}
