if (Meteor.isServer){
	fs = Npm.require( 'fs' );
	var fs = Npm.require('fs');
	var path = Npm.require('path');

	Router.map(function () {
		this.route('assets', {
			where: 'server',
			path: '/screenshots/:filename(.*)',
			action: function() {
				var filename = path.normalize(path.join(basePath, this.params.filename));
				var res = this.response;	

				if (filename.substr(0, basePath.length) != basePath ||
						!fs.existsSync(filename) ||
						!fs.statSync(filename).isFile()) {
					res.writeHead(404, {'Content-Type': 'text/html'});
					res.end('404: no such asset: ' + this.params.filename);
					return;
				}
				var data = fs.readFileSync(filename);
				var mimeType = mime.lookup(filename);
				res.writeHead(200, { 'Content-Type': mimeType });
				res.write(data);
				res.end();
			},
		});
	});
	
	var mime = {
		lookup: (function() {

			var mimeTypes = {
				".html": "text/html",
				".js":   "application/javascript",
				".json": "application/json",
				".png":  "image/png",
				".gif":  "image/gif",
				".jpg":  "image/jpg",
			};

			return function(name) {
				var type = mimeTypes[path.extname(name)];
				return type || "text/html";
			};
		}())
	};
}


Meteor.methods({
	addNewIssue: function (newIssue) {
		if (Meteor.isServer){
			var storedImages = [];
			if (newIssue.images){
				newIssue.images.forEach(function(image, i){
					var target = newIssue.counter + '_' + i + '_' + (new Date).getTime() + '.png';
					var buffer = new Buffer(image.substr(22), 'base64');
					fs.writeFileSync(basePath + "/" + target, buffer, 'binary');
					storedImages.push('screenshots/' + target);
				});
				newIssue.images = storedImages;
			}
			Issues.insert(newIssue);
		}
	},
	addNewImage: function (image, issueId) {
		if (Meteor.isServer){
			var issue = Issues.findOne(issueId);
			images = issue.images?issue.images:[];

			var target = issue.counter + '_' + images.length + '_' + (new Date).getTime() + '.png';
			var buffer = new Buffer(image.substr(22), 'base64');
			fs.writeFileSync(basePath + "/" + target, buffer, 'binary');

			images.push('screenshots/'+target);

			Issues.update(issueId, {
					$set: {images: images}
			});
		}
	}
})