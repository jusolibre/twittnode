var fs         = require('fs');
var https      = require('https');
var Twitter    = require('twitter');
var express    = require('express');
var multer     = require('multer')
var upload     = multer({ dest: 'uploads/' })
var storage    = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now());
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
    }
});
var upload     = multer({ storage : storage}).single('userPhoto');

app = express();
app.use('/photo', express.static(__dirname + '/uploads/'));
app.use('/here', express.static(__dirname));


https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app).listen(443);

var options = {
    root: __dirname,
    dotfiles: 'allow',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};

/*
**
** recherche et affichage des twitt a propos de OFP2017
**
*/

app.get('/twittlist', function(req, res){
    client.get('https://twitter.com/search?q=%40OFP2017', function(error, tweets, response) {
        console.log(response);  // Raw response object.
        res.send(tweets);
    });
});

/*
**
** dl des photo du dossier uploads
**
*/

app.get('/photo/:file', function(req, res){
    res.sendFile(__dirname + "/uploads/" + req.params.file);
});

/*
**
** envoie du twitt avec retour sur une recherche apres l'envoie
**
*/

app.get('/post/:name', function(req, res){
    res.header('Content-type', 'text/html');
    client.post('statuses/update', {status: req.params.name},  function(error, tweet, response) {
        console.log(response);  // Raw response object.
    });
    client.get('https://twitter.com/search?q=%40twitterapi', function(error, tweets, response) {
        console.log(response);  // Raw response object.
    });
});

/*
**
** envoie du twitt avec image
**
*/

app.get('/media/:name', function(req, res) {
    var data = fs.readFileSync(req.params.name);

    client.post('media/upload', {media: data}, function(error, media, response) {
        var status = {
            status: 'Am i sending it correctly ?',
            media_ids: media.media_id_string // Pass the media id string
        }
        client.post('statuses/update', status, function(error, tweet, response) {
            if (!error) {
                console.log(tweet);
            }
        });
        client.get('https://twitter.com/search?q=%40twitterapi', function(error, tweets, response) {
            res.send(tweets);
        });
    });
});

/*
**
** redirection sur la page principale à l'acces sur le site
**
*/

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html');
});
/*
**
** page qui vas upload l'image
**
*/

app.post('/uploadfiles', function(req, res) {
    upload(req,res,function(err) {
        if(err) {
            console.log(err);
            return res.end(err + "Error uploading file.");
        }

        var donnee = JSON.stringify(req.file.path);
        var donnee = "/" + donnee;
        var data = fs.readFileSync(__dirname + "/" + req.file.path);

        client.post('media/upload', {media: data}, function(error, media, response) {
            var status = {
                status: '#OFP2017',
                media_ids: media.media_id_string // Pass the media id string
            }
            client.post('statuses/update', status, function(error, tweet, response) {
                if (!error) {
                    console.log(tweet);
                }
            });
        });
        console.log(req.file);
        res.sendFile(__dirname + '/client.html');
    });
});
