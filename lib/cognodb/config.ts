export class ConfigError extends Error {
  override readonly name = "ConfigError";
  constructor(missing: string[]) {
    super(
      `Missing CognoDB environment variable(s): ${missing.join(", ")}. ` +
        `Create a .env.local from .env.example with COGNODB_URI and COGNODB_PASSWORD set.`
    );
  }
}

export interface CognoDBConfig {
  uri: string;
  username: string;
  password: string;
  database: string;
}

function required(name: string, value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === "") {
    return name;
  }
  return undefined;
}

export function loadCognoDBConfig(): CognoDBConfig {
  const uri = process.env.COGNODB_URI;
  const username = process.env.COGNODB_USERNAME ?? "cognodb";
  const password = process.env.COGNODB_PASSWORD;
  const database = process.env.COGNODB_DATABASE ?? "neo4j";

  const missing = [
    required("COGNODB_URI", uri),
    required("COGNODB_PASSWORD", password),
  ].filter((name): name is string => name !== undefined);

  if (missing.length > 0) {
    throw new ConfigError(missing);
  }

  return {
    uri: uri as string,
    username,
    password: password as string,
    database,
  };
}
