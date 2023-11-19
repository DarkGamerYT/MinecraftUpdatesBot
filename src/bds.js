const fs = require( "fs" );
const Utils = require( "./utils.js" );

let bds = [];

const versionData = async (data, preview = false) => {
	for (let i = 1; i < data.length; i++) {
		const file = data[i];
		await fetch(
			file.download_url,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		).then((res) => res.json())
		.then(
			async (data) => bds.push({
				version: data.version,
				preview,
				date: data.date,
				build_id: data.build_id,
				commit_hash: data.commit_hash,
			}),
		).catch(() => {});
	};
};

const saveBDS = async() => {
	await fetch(
		"https://api.github.com/repos/Bedrock-OSS/BDS-Versions/contents/windows_preview",
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	).then((res) => res.json())
	.then(async(data) => await versionData(data, true));

	await fetch(
		"https://api.github.com/repos/Bedrock-OSS/BDS-Versions/contents/windows",
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	).then((res) => res.json())
	.then(async(data) => await versionData(data));

	bds.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	fs.writeFileSync( __dirname + "/data/bds.json", JSON.stringify( bds, null, 4 ) );
};

saveBDS();
module.exports = saveBDS;