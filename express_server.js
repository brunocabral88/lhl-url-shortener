let express = require('express');
let app = express();
let PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {
	012345: {
		id: "012345",
		email: "test@test.org",
		password: "test123"
	},
	012346: {
		id: "012346",
		email: "test2@test.org",
		password: "password"
	}
}

function getUser(cookies) {
	for (user in users) {
		if (cookies.user_id == users[user].id) {
			return users[user];
		}
	}
	return null;
}

function generateRandomString() {
	let output = '';
	[1,2,3,4,5,6].map(() => {
		let random = Math.ceil((Math.random() * (122 - 96)) + 96);
		output += String.fromCharCode(random);
	})
	return output;
}

// Check user returns the user id or false
function checkUser(email,password) {
	for (user in users) {
		if (users[user].email == email && users[user].password == password)
			return users[user].id;
	}
	return false;
}

// Lists all urls
app.get('/urls',(req,res) => {
	let currUser = getUser(req.cookies);
	let templateVars = { 
		urls : urlDatabase,
		user: currUser
	};
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
	let currUser = getUser(req.cookies); 
	let templateVars = { 
		shortURL: req.params.id,
		user: currUser
	}
	res.render('urls_show',templateVars);
});

app.get('/register',(req,res) => {
	res.render('url_register');
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

app.get('/login',(req,res) => {
	res.render('urls_login');
});

// Update record /urls/:id
app.post('/urls/:id',(req,res) => {
	if (urlDatabase.hasOwnProperty(req.params.id)) {
		urlDatabase[req.params.id] = req.body.longURL;
		res.redirect('/urls');
	} else {
		res.redirect('/urls');
	}
});

// New records (to be implemented)
app.post('/urls',(req,res) => {
	console.log(req.body);
	res.send('OK');
});

// POST /login
app.post('/login',(req,res) => {
	let userid = checkUser(req.body.username, req.body.password);
	if (userid) {
		res.cookie('user_id',userid);
		console.log('User sucessfully logged in: ',userid);
		res.redirect('/urls');
	} else {
		console.log('Failed attempt to login: ', req.body.username);
		res.sendStatus(403);
	}
});

// Registration post
app.post('/register',(req,res) => {
	if (!req.body.username || !req.body.password) {
		res.sendStatus(400);
		return;
	}
	let userid = checkUser(req.body.username, req.body.password)
	if (userid) {
		res.sendStatus(400);
		return;
	}
	let newUserID = generateRandomString();
	users[newUserID] = {
		id: newUserID,
		email: req.body.username,
		password: req.body.password
	};
	res.cookie('user_id',newUserID);
	console.log(users);
	res.redirect('/urls');
});

app.post('/logout',(req,res) => {
	if (req.cookies.user_id) {
		res.clearCookie('user_id');
	}
	res.redirect('/urls');
})

app.listen(PORT,() => {
	console.log(`Running and listening on port ${PORT}`);
})