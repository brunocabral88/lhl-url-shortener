let express = require('express');
let app = express();
let PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

let urlDatabase = {
	"b2xVn2": { long_url: "http://www.lighthouselabs.ca", user_id: '012346' },
	"9sm5xK": { long_url: "http://www.google.com", user_id: '012345' }
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

function getUser(userId) {
	for (user in users) {
		if (userId == users[user].id) {
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

function urlForUser(id) {
	const userURLs = {};
	for (url in urlDatabase) {
		if (urlDatabase[url].user_id == id) {
			userURLs[url] = urlDatabase[url];
		}
	}
	return userURLs;
}

// Lists all urls
app.get('/urls',(req,res) => {
	let currUser = getUser(req.cookies.user_id);
	if (currUser) {
		let templateVars = {
			urls : urlForUser(currUser.id),
			user: currUser
		};
		res.render('urls_index',templateVars);		
	} else {
		res.redirect('/login');
	}
});

app.get('/urls/new',(req,res) => {
	if (getUser(req.cookies.user_id)) {
		res.render('urls_new');	
	} else {
		res.redirect('/login');
	}
	
});

app.get('/u/:shortURL',(req,res) => {
	let longURL = urlDatabase[req.params.shortURL].long_url;
	if (longURL) {
		res.redirect(longURL);	
	} else {
		res.redirect('/');
	}
	
});

app.get('/urls/:id',(req,res) => {
	let currUser = getUser(req.cookies.user_id);
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
	const user = getUser(req.cookies.user_id);
	if (!user) {
		res.redirect('/urls');
	}
	else if(urlDatabase.hasOwnProperty(req.params.id) && urlDatabase[req.params.id].user_id == user.id) {
		urlDatabase[req.params.id].long_url = req.body.longURL;
		res.redirect('/urls');
	} else {
		res.redirect('/urls');
	}
});

// New records (to be implemented)
app.post('/urls',(req,res) => {
	const user = getUser(req.cookies.user_id);
	if (user) {
		const urlID = generateRandomString();
		urlDatabase[urlID] = { };
		urlDatabase[urlID].long_url = req.body.longURL;
		urlDatabase[urlID].user_id = user.id;
		res.redirect('/urls');
	} else {
		res.redirect('urls_login');
	}
	
});

// POST /login
app.post('/login',(req,res) => {
	let userid = checkUser(req.body.username, req.body.password);
	if (userid) {
		res.cookie('user_id',userid);
		res.redirect('/urls');
	} else {
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