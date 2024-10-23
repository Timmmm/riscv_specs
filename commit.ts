#!/usr/bin/env -S deno run -A

async function main() {
    const diff = await new Deno.Command("git", { args: ["status", "--porcelain"] }).output();
    if (!diff.success) {
        throw Error("git diff failed");
    }
    if (diff.stdout.byteLength !== 0) {
        console.log("Changes detected - committing & pushing.");
        // Changes detected.
        const add_status = await new Deno.Command("git", { args: ["--no-pager", "add", "."] }).spawn().status;
        if (!add_status.success) {
            throw Error("git add failed");
        }
        const commit_status = await new Deno.Command("git", { args: ["--no-pager", "commit", "-m", "Automatic Update"] }).spawn().status;
        if (!commit_status.success) {
            throw Error("git commit failed");
        }
        const push_status = await new Deno.Command("git", { args: ["--no-pager", "push"] }).spawn().status;
        if (!push_status.success) {
            throw Error("git push failed");
        }
    } else {
        console.log("No changes detected.");
    }
}

await main();
