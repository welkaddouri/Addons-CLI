#!/usr/bin/env node

var WAM_BASE = "http://addons.wakanda.org/";
var program = require('commander');
var request = require('request');
var chalk = require('chalk');
var inquirer = require("inquirer");
var unzip = require('unzip');
var fs = require('fs');
var fstream = require('fstream');



program
.version('0.0.1')
.usage('[options] <argument>')
.option('-i, --install', 'Install wakanda package')
.option('-s, --search', 'Display all package with a name matched by the keyword')
.option('-t, --target [path]', 'Folder where the package to be installed')
.parse(process.argv);

if (!program.args.length) {
	program.help();
} else {

	if (program.search) {
		var url = WAM_BASE + 'rest/Addons/?&$top=1000&$filter="name=*' + program.args + '*"';

		request({
			method : 'GET',
			headers : {
				'User-Agent' : 'WAM Command Line'
			},
			url : url
		}, function (error, response, body) {

			if (!error && response.statusCode == 200) {
				var body = JSON.parse(body);
				if (body.__ENTITIES.length == 0) {
					console.log(chalk.red('No Wakanda Package Found'));
				} else {
					console.log(chalk.green('package list result :\n'));
					for (var i = 0; i < body.__ENTITIES.length; i++) {
						console.log(chalk.cyan.bold('Name: ' + body.__ENTITIES[i].name));
						console.log(chalk.grey('Desc: ' + body.__ENTITIES[i].description));
						console.log(chalk.magenta.bold('Owner: ' + body.__ENTITIES[i].owner + '\n'));

					}

				}
			} else if (error) {
				console.log(chalk.red('Error: ' + error));
				process.exit(1);
			}

		});
	}

	if (program.install) {
		if (program.target) {
			var url = WAM_BASE + 'rest/Addons/?&$top=1000&$expand=branchs,dependencies&$filter="name=' + program.args + '"';

			request({
				method : 'GET',
				headers : {
					'User-Agent' : 'WAM Command Line'
				},
				url : url
			}, function (error, response, body) {

				if (!error && response.statusCode == 200) {
					var body = JSON.parse(body);
					if (body.__ENTITIES.length != 1) {
						console.log(chalk.red('No Wakanda Package Found'));
					} else {

						var out = fs.createWriteStream('out.zip');
						var id,
						sha,
						name;
						id = body.__ENTITIES[0].ID;
						sha = body.__ENTITIES[0].sha;
						name = body.__ENTITIES[0].name;
						url = WAM_BASE + 'download?id=' + id + '&sha=' + sha;
						console.log(chalk.green('Installing ' + name));
						console.log(chalk.green(url));
						var req = request({
								method : "GET",
								url : url
							}).pipe(fs.createWriteStream('out.zip'));

						req.on('close', function () {

							var r = fs.createReadStream("out.zip").pipe(unzip.Parse()).pipe(fstream.Writer(program.target))
								r.on("close", function () {
									fs.unlinkSync("out.zip");
									fs.renameSync(program.target + "\\" + name + "-" + sha, program.target + "\\" + name);

								});
						});

					}

				} else if (error) {
					console.log(chalk.red('Error: ' + error));
					process.exit(1);
				}
			});
		} else {
			console.log(chalk.red('You must provide the target -t'));
		}
	}
}