import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";

export async function acquireStateLock(file, { timeoutMs = 120000, pollMs = 50 } = {}) {
	const lockPath = `${file}.lock`;
	await mkdir(path.dirname(lockPath), { recursive: true, mode: 0o700 });
	const token = randomUUID();
	const started = Date.now();
	while (true) {
		try {
			const handle = await open(lockPath, "wx", 0o600);
			try {
				await handle.writeFile(`${JSON.stringify({ pid: process.pid, token })}\n`);
				await handle.sync();
			} finally {
				await handle.close();
			}
			let released = false;
			return async () => {
				if (released) return;
				released = true;
				const current = JSON.parse(await readFile(lockPath, "utf8"));
				if (current.token === token) await rm(lockPath);
			};
		} catch (error) {
			if (error?.code !== "EEXIST") throw error;
			// A separate recovery gate prevents two contenders from both stealing
			// the stale lock (and accidentally unlinking the new winner's lock).
			const gate = `${lockPath}.recovery`;
			let recovery;
			try {
				recovery = await open(gate, "wx", 0o600);
				const item = await lstat(lockPath);
				if (item.isSymbolicLink()) throw new Error(`Unsafe state lock: ${lockPath}`);
				let owner;
				try { owner = JSON.parse(await readFile(lockPath, "utf8")); }
				catch (error) {
					if (error?.code === "ENOENT") throw error;
					// Never guess whether a partially written lock is still active.
				}
				if (Number.isInteger(owner?.pid) && owner.pid > 0) {
					try { process.kill(owner.pid, 0); }
					catch (error) {
						if (error?.code === "ESRCH") {
							const retired = `${lockPath}.${token}.retired`;
							await rename(lockPath, retired);
							await rm(retired);
						}
					}
				}
			} catch (error) {
				if (!["EEXIST", "ENOENT"].includes(error?.code)) throw error;
			} finally {
				if (recovery) {
					await recovery.close();
					await rm(gate, { force: true });
				}
			}
			if (Date.now() - started >= timeoutMs) {
				throw new Error(`Timed out waiting for the canonical canvas state owner: ${lockPath}. An incomplete lock requires explicit recovery.`);
			}
			await new Promise((resolve) => setTimeout(resolve, pollMs));
		}
	}
}
