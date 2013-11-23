var fs = require('fs'), uuid = require('node-uuid'), utils = require('utils'), slugify = utils.slugify, knox = require('knox'), _ = require('underscore');

// Route that takes the post upload request and sends the server response
exports.upload = function (req, res) {

    winston.info("Upload parameters", [req.route.params[0], req.body]);

    winston.info("Uploaded Files", [req.files]);

	var S3 = knox.createClient({
		key : process.env.AWSKEY,
		secret : process.env.AWSSECRET,
		bucket: process.env.S3BUCKET
    });
	var slugs = {
		farm : req.body["farm-slug"]
	}
	switch (req.route.params[0]) {
		case 'farm/logo':
			var file = req.files.logo; 
			var uploadpath = "farms/" + slugs.farm;
			if(file.name !== '') {
				uploadpath += "/" + "logo." + file.name.split(".").pop();
				uploadFile(uploadpath, file, S3, updateFarmLogo(slugs.farm, file, res));
			}
			break;

        case 'farm/gallery/photo':
            var uploadpath = "farms/" + slugs.farm;
            uploadpath += "/gallery";
            for (i = 0; i < req.files.gallery.length; i++) {
                var file = req.files.gallery[i];
                if (file.name !== '') {
                    var filepath = uploadpath + "/" + file.name;
                    uploadFile(filepath, file, S3, updateFarmGallery(slugs.farm, file, res));
                }
            }
            break;

        case 'farm/share/photo':
            var uploadpath = "farms/" + slugs.farm;
            uploadpath += "/shares";
            uploadpath += "/" + req.body["share-id"];
            uploadpath += "/photo";
                var file = req.files.photo;
                if (file.name !== '') {
                    var filepath = uploadpath + "/" + file.name;
                    uploadFile(filepath, file, S3, updateSharePhoto(req.body["sku-id"], req.body["share-id"], file, res));
                }
            break;
        case 'courier/license':
        case 'courier/registration':
            var uploadpath = "couriers/" + slugify(req.body.courier);
            uploadpath += "/" + file.name;
            break;

        default:
            var uploadpath = "uploads/" + file.name;
            break;
    }

}
var uploadFile = function (uploadpath, file, S3, callback) {
    winston.info("Uploading to ", uploadpath);

    if (process.env.NODE_ENV !== "development") {
        var position = uploadpath.lastIndexOf('.');
        var timestamp = fs.statSync(file.path).mtime.getTime();
        var fileName = _(uploadpath).splice(position, 0, '.' + timestamp);
        utils.uploadImage(file.path, fileName, file.type, S3, callback);
    } else {
        //utils.moveFile(file.path, __dirname + "/../../../public/" + uploadpath, winston.info);
        callback(__dirname + "/../../../public/" + uploadpath)
    }
}
var updateFarmLogo = function (fname, file, res, CDN) {
    return function (path) {
        var FarmModel = require('farms').models.Farm;
        FarmModel.findOne({
            slug: fname
        }, function (err, farm) {
            winston.info("Retrieving farm:", farm);
            if (err) {
                winston.error("Error", error);
            } else {
                farm.logo = "//" + process.env.CDNHOST + "/" + path;
                farm.markModified('logo');
                farm.save(function (err) {
                    if (err) {
                        winston.error("Couldn't add logo to farm.");
                        winston.error("Error:", err)
                        res.json({
                            files: [
                            ]
                        });
                    } else {
                        winston.info("New logo \"" + path + "\" succesfully added to farm.", farm.logo);
                        res.json({
                            files: [
                                {
                                    name: file.name,
                                    size: file.size,
                                    url: "//" + process.env.CDNHOST + "/" + path,
                                    thumbnail_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_type: "DELETE"
                                }
                            ]
                        });
                    }
                });
            }
        });
    }
}
var updateSharePhoto = function (skuid, shareid, file, res, CDN) {
    return function (path) {
        var SKU = require('farms').models.SKU;
        SKU.findById(skuid, function (err, sku) {
            if (err) {
                throw new Error(err)
            } else {
              if(!sku){
                winston.error("Couldn't add photo to gallery.");
                            winston.error("Error: SKU didn't exist")
                            res.json({
                                files: [
                            ]
                            });
              } else {
                var share = sku.shares.id(shareid);
                if (!share) {
                    winston.error("Couldn't find share in sku shares.", sku.shares, shareid);
                    res.json({
                        files: [
                            ]
                    });
                } else {
                    winston.info("Found share, pushing image", share);
                    share.photo ="//" + process.env.CDNHOST + "/" + path;
                    share.markModified("photo");
                  sku.markModified("shares");
                    sku.save(function (err) {
                        if (err) {
                            winston.error("Couldn't add photo to gallery.");
                            winston.error("Error:", err)
                            res.json({
                                files: [
                            ]
                            });
                        } else {
                            winston.info("New photo \"" + path + "\" succesfully added to share.", sku.shares, share);
                            res.json({
                                files: [
                                {
                                    name: file.name,
                                    size: file.size,
                                    url: "//" + process.env.CDNHOST + "/" + path,
                                    thumbnail_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_type: "DELETE"
                                }
                            ]
                            });
                        }
                    });
                }
              }
            }
        });
    }
}

var updateFarmGallery = function (fname, file, res, CDN) {
    return function (path) {
        var FarmModel = require('farms').models.Farm;
        FarmModel.findOne({
            slug: fname
        }, function (err, farm) {
            winston.info("Retrieving farm:", farm);
            if (err) {
                winston.error("Error", error);
            } else {
                farm.gallery.push("//" + process.env.CDNHOST + "/" + path);
                farm.markModified('gallery');
                farm.save(function (err) {
                    if (err) {
                        winston.error("Couldn't add photo to gallery.");
                        winston.error("Error:", err)
                        res.json({
                            files: [
                            ]
                        });
                    } else {
                        winston.info("New photo \"" + path + "\" succesfully added to farm.", farm.gallery);
                        res.json({
                            files: [
                                {
                                    name: file.name,
                                    size: file.size,
                                    url: "//" + process.env.CDNHOST + "/" + path,
                                    thumbnail_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_url: "//" + process.env.CDNHOST + "/" + path,
                                    delete_type: "DELETE"
                                }
                            ]
                        });
                    }
                });
            }
        });
    }
}
