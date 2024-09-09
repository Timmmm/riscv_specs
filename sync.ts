#!/usr/bin/env -S deno run -A
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

interface Release {
    id: number;
    tag_name: string;
    name: string;
    assets: Asset[];
}

interface Asset {
    name: string;
    browser_download_url: string;
}

// GitHub API base URL.
const GITHUB_API_URL = "https://api.github.com/repos";

// Fetch releases from a GitHub repository
async function fetchReleases(owner: string, repo: string): Promise<Release[]> {
    const headers = new Headers({
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Deno",
    });

    // We can get up to 100, which is enough to get the latest ratified ones.
    const response = await fetch(`${GITHUB_API_URL}/${owner}/${repo}/releases?per_page=100`, { headers });

    if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
    }

    const releases: Release[] = await response.json();
    return releases;
}

// Function to download assets that are HTML files
async function downloadHtmlAssets(releases: Release[]) {
    for (const release of releases) {
        const releaseDir = `./spec/${release.tag_name}`;
        await ensureDir(releaseDir); // Ensure directory for each release

        for (const asset of release.assets) {
            if (asset.name.endsWith(".html")) {
                const assetResponse = await fetch(asset.browser_download_url);

                if (!assetResponse.ok) {
                    console.warn(`Failed to download ${asset.name}: ${assetResponse.statusText}`);
                    continue;
                }

                const assetPath = `${releaseDir}/${asset.name}`;
                const fileData = await assetResponse.arrayBuffer();
                await Deno.writeFile(assetPath, new Uint8Array(fileData));
                console.log(`Downloaded ${asset.name} to ${assetPath}`);
            }
        }
    }
}

// Function to generate an index.html file
async function generateIndexHtml(releases: Release[]) {
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RISC-V Specifications</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>RISC-V Specifications</h1>

    <h2>Latest Ratified Release 2024-04-11</h2>

    <ul>
        <li><a href="./spec/20240411/priv-isa-asciidoc.html">Privileged</a></li>
        <li><a href="./spec/20240411/unpriv-isa-asciidoc.html">Unprivileged</a></li>
    </ul>

    <h2>All Relases</h2>

    <ul>
    `;

    for (const release of releases) {
        if (release.assets.some(asset => asset.name.endsWith(".html"))) {
            htmlContent += `    <li>${release.name || release.tag_name}<ul>`;

            for (const asset of release.assets) {
                if (asset.name.endsWith(".html")) {
                    htmlContent += `<li><a href="./spec/${release.tag_name}/${asset.name}">${asset.name}</a></li>`;
                }
            }

            htmlContent += `</ul></li>\n`;
        }
    }

    htmlContent += "</ul></body></html>";

    // Write the index.html file
    await Deno.writeTextFile("index.html", htmlContent);
    console.log("Generated index.html");
}

// Main execution
async function main() {
    const owner = "riscv";
    const repo = "riscv-isa-manual";

    try {
        const releases = await fetchReleases(owner, repo);
        await generateIndexHtml(releases);
        await downloadHtmlAssets(releases);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

await main();
