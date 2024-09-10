#!/usr/bin/env -S deno run -A

async function main() {
    const diff = await new Deno.Command("git", { args: ["diff"] }).output();
    if (diff.code === 1) {
        // Changes detected.
        const add_status = await new Deno.Command("git", { args: ["--no-pager", "add", "."] }).output();
        if (add_status.code !== 0) {
            throw Error("git add failed");
        }
        const commit_status = await new Deno.Command("git", { args: ["--no-pager", "commit", "-m", "Automatic Update"] }).output();
        if (commit_status.code !== 0) {
            throw Error("git add failed");
        }
        const push_status = await new Deno.Command("git", { args: ["--no-pager", "push"] }).output();
        if (push_status.code !== 0) {
            throw Error("git add failed");
        }
    }
}

await main();
