const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const configPath = path.join(projectRoot, "assets", "js", "map-config.js");

if (!fs.existsSync(envPath)) {
    throw new Error(".env was not found in the project root.");
}

const envContents = fs.readFileSync(envPath, "utf8");
const mapKeyLine = envContents
    .split(/\r?\n/)
    .find((line) => /^\s*map_api_key\s*=/i.test(line));
const match = mapKeyLine?.match(/^\s*map_api_key\s*=\s*(.*?)\s*$/i);
const apiKey = match?.[1].replace(/^(['"])(.*)\1$/, "$2").trim();

if (!apiKey) {
    throw new Error("map_api_key is missing or empty in .env.");
}

fs.writeFileSync(
    configPath,
    `window.GOOGLE_MAPS_API_KEY = ${JSON.stringify(apiKey)};\n`,
    "utf8",
);

console.log("Generated assets/js/map-config.js from .env.");
