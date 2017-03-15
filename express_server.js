let express = require('express');
let app = express();
let PORT = 8080;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
	let output = '';
	[1,2,3,4,5,6].map(() => {
		let random = Math.ceil((Math.random() * (122 - 96)) + 96);
		output += String.fromCharCode(random);
	})
	return output;
}

// Lists all urls
app.get('/urls',(req,res) => {
	let templateVars = { urls : urlDatabase };
	res.render('urls_index',templateVars);
});

app.get('/urls/new',(req,res) => {
	res.render('urls_new');
});

app.get('/u/:shortURL',(req,res) => {
	let longURL = urlDatabase[req.params.shortURL];
	if (longURL) {
		res.redirect(longURL);	
	} else {
		res.redirect('/');
	}
	
});

app.get('/urls/:id',(req,res) => {
	let templateVars = { shortURL: req.params.id }
	res.render('urls_show',templateVars);
});

// New records (to be implemented)
app.post('/urls',(req,res) => {
	console.log(req.body);
	res.send('OK');
});

// Handles deletion
app.post('/urls/:id/delete',(req,res) => {
	if (urlDatabase.hasOwnProperty(req.params.id)) {
		delete urlDatabase[req.params.id];
		res.redirect('/urls');
	} else {
		res.redirect('/urls');
	}
});

// Update record /urls/:id
app.post('/urls/:id',(req,res) => {
	if (urlDatabase.hasOwnProperty(req.params.id)) {
		urlDatabase[req.params.id] = req.body.longURL;
		res.redirect('/urls');
	} else {
		redirect('/urls');
	}
});

app.listen(PORT,() => {
	console.log(`Running and listening on port ${PORT}`);
})