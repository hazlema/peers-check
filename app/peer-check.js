import { join } from 'node:path';
import { opendir, readFile, access, constants } from 'node:fs/promises';

const driveBase = await findBase();
const peerDir = join(driveBase, "drives", "peers");
const jsonFile = join(driveBase, "drives.json");

// Scan to find the basedir
async function findBase() {
	async function testDir(dir) {
		if (!dir) return false;

		try {
			await access(dir, constants.R_OK | constants.X_OK);
			return true;
		} catch (err) {
			return false;
		}
	}

	const dirs = [
		join(process.cwd(), "..", "drive"),
		join(process.cwd(), "..", "..", "drive"),
		join(process.cwd(), "..", "..", "..", "drive"),
		join(process.cwd(), "drive"),
		process.argv[2]
	];

	for (const dir of dirs) {
		if (await testDir(dir)) return dir;
	}

	console.error("Could not find base directory. You can specify it as an argument.");
	return null;
}

console.print = function (str) {
	const
		regex = /@x[0-9,A-F][0-9,A-F]/gmi,
		colors = {
			"F0": "\x1b[30m", "F4": "\x1b[31m", "F2": "\x1b[32m",
			"F6": "\x1b[33m", "F1": "\x1b[34m", "F5": "\x1b[35m",
			"F3": "\x1b[36m", "F7": "\x1b[37m",
			"F8": "\x1b[30;1m",
			"F9": "\x1b[34;1m", "FA": "\x1b[32;1m", "FB": "\x1b[36;1m",
			"FC": "\x1b[31;1m", "FD": "\x1b[35;1m", "FE": "\x1b[33;1m",
			"FF": "\x1b[37;1m",
			"B0": "\x1b[40m", "B4": "\x1b[41m", "B2": "\x1b[42m",
			"B6": "\x1b[43m", "B1": "\x1b[44m", "B5": "\x1b[45m",
			"B3": "\x1b[46m", "B7": "\x1b[47m",
			"B8": "\x1b[40;1m",
			"B9": "\x1b[44;1m", "BA": "\x1b[42;1m", "BB": "\x1b[46;1m",
			"BC": "\x1b[41;1m", "BD": "\x1b[45;1m", "BE": "\x1b[43;1m",
			"BF": "\x1b[47;1m"
		}

	let matches = [], m;
	while ((m = regex.exec(str)) !== null) {
		if (m.index === regex.lastIndex) regex.lastIndex++;
		m.forEach((match, groupIndex) => matches.push(match))
	}
	matches.forEach(match => {
		str = str.replace(match,
			"\x1b[0;0m" + colors["B" + match.toUpperCase()[2]] + colors["F" + match.toUpperCase()[3]])
	})
	console.log(str + "\x1b[0;0m");
}


async function init() {
	var passed = false

	console.print(`@X0FDrive Directory: @X0E${driveBase}`);
	console.print(`@X0FPeer Directory: @X0E${peerDir}`);
	console.print(`@X0FJSON File: @X0E${jsonFile}`);
	console.log();

	try {
		await Promise.all([
			access(driveBase, constants.R_OK | constants.X_OK),
			access(peerDir, constants.R_OK | constants.X_OK),
			access(jsonFile, constants.F_OK | constants.R_OK)
		]);
		console.print("@X0A✓ @X0FSanity check passed, All systems are a go");
		console.log();
		passed = true
	} catch (error) {
		console.print(`@X0CX @X0FSanity check failed, exiting`);
		throw new Error(error.message);
	}

	return passed
}

async function buildDirs() {
	const dirs = [];

	try {
		const dir = await opendir(peerDir);
		for await (const dirent of dir) {
			if (dirent.isDirectory()) dirs.push(dirent.name);
		}
	} catch (err) {
		console.print(`@X0CX @X0FError reading directory:\n@X0E${err}`);
	}

	return dirs;
}

async function readJson() {
	var json

	try {
		json = JSON.parse(await readFile(jsonFile));
	} catch (err) {
		console.print(`@X0CX @X0FInvalid JSON detected:\n@X0E${err}`);
	}
	return json;
}

function orphanScan(dirs) {
    let isOrphan = false;

    return readFile(jsonFile, 'utf8')
        .then(rawFile => {
			console.print("");
            console.print("@X0FStarting Dir to JSON check...");
            // Dir to Json
            for (const dir of dirs) {
                if (!rawFile.includes(dir)) {
                    console.print(`@X0CX @X0FDirectory not in JSON: @X0E${dir}`);
                    isOrphan = true;
                } else {
                    console.print(`@X0A✓ @X0FTesting @X0B${dir}`);
                }
            }

			if (!isOrphan) {
				console.print("");
                console.print("@X0A✓ @X0FEverything looks good");
            }
            return rawFile; // Pass rawFile to the next .then()
        })
        .then(rawFile => {
			console.print("");
            console.print("@X0FStarting JSON to Dir check...");
            // Json to dir
            const regex = /[\\\/]{1}([a-z].[0-9]+)[\\\/]{1}/gm;
            const matched = new Set();
            let match;

            while ((match = regex.exec(rawFile)) !== null) {
                const dirName = match[1];
                if (!matched.has(dirName)) {
                    matched.add(dirName);
                    if (!dirs.includes(dirName)) {
                        console.print(`@X0CX @X0FA path specified in the JSON does not have physical directory: @X0E${dirName}`);
                        isOrphan = true;
                    } else {
                        console.print(`@X0A✓ @X0FTesting @X0B${dirName}`);
                    }
                }
            }

            if (!isOrphan) {
				console.print("");
                console.print("@X0A✓ @X0FEverything looks good");
            }

            return isOrphan;
        });
}

// scan rawfile duplicate repos
async function duplicateScan(json) {
	var rawFile = (await readFile(jsonFile)).toString();
	var duplicates = [];

	for (var e of Object.keys(json)) {
		var pattern = new RegExp("." + e + "*", "g");
		if (rawFile.match(pattern).length > 1) {
			duplicates[e] = rawFile.match(pattern);
		};
	}

	if (Object.keys(duplicates).length == 0) {
		console.print("@X0A✓ @X0FEverything looks good");
	} else {
		for (var dupes of Object.keys(duplicates)) {
			console.print(`@X0CX @X0FDuplicate: @X0E${dupes}`);
		}
	}

	return duplicates
}

console.print("@X0FPinokio Peer Checker");
console.print("@X0B====================");

if (await init()) {
	console.print("@X0FGetting directories");
	console.print("@X0B===================");
	var dirs = await buildDirs();
	console.log(dirs);

	console.log();
	console.print("@X0FReading JSON Repos (Won't detect dupes)");
	console.print("@X0B=======================================");
	var json = await readJson();
	console.log(Object.keys(json));

	console.log();
	console.print("@X0FScanning JSON for duplicates");
	console.print("@X0B============================");
	var duplicates = await duplicateScan(json)

	console.log();
	console.print("@X0FScanning for orphan directories");
	console.print("@X0B===============================");
	await orphanScan(dirs);
}
