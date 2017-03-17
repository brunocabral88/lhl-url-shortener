const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
    name: 'session',
    keys: ['lighthouselabs'],
    maxAge: 24 * 60 * 60 * 1000 * 7 // 1 week
}));
app.set('view engine', 'ejs');

let urlDatabase = {
    "b2xVn2": { long_url: "http://www.lighthouselabs.ca", user_id: '012346',
    clicks: 0, unique_visitors: 0,
    visits: [ { timestamp: "Fri Mar 17 2017 13:06:09 GMT-0400 (EDT)", visitor_id: '0123456' }
    ] },
    "9sm5xK": { 
        long_url: "http://www.google.com", user_id: '012345',clicks: 0, unique_visitors: 0,
        visits: [ { timestamp: "Fri Mar 17 2017 13:06:09 GMT-0400 (EDT)", visitor_id: '0123456' }
    ]}
};

const users = {
    '012345': {
        id: "012345",
        email: "test@test.org",
        password: bcrypt.hashSync("test123",10)
    },
    '012346': {
        id: "012346",
        email: "test2@test.org",
        password: bcrypt.hashSync("password",10)
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
        if (users[user].email == email && bcrypt.compareSync(password,users[user].password))
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

app.get('/',(req,res) => {
    res.redirect('/urls');
})

// Lists all urls
app.get('/urls',(req,res) => {
    let currUser = getUser(req.session.user_id);
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

// Urls index (user private)
app.get('/urls/new',(req,res) => {
    if (getUser(req.session.user_id)) {
        res.render('urls_new'); 
    } else {
        res.redirect('/login');
    }
    
});

// let urlDatabase = {
//  "b2xVn2": { long_url: "http://www.lighthouselabs.ca", user_id: '012346',
//  clicks: 0, unique_visitors: 0,
//  visits: [ { timestamp: "Fri Mar 17 2017 13:06:09 GMT-0400 (EDT)", visitor: '0123456' }
//  ] },
//  "9sm5xK": { 
//      long_url: "http://www.google.com", user_id: '012345',clicks: 0, unique_visitors: 0,
//      visits: [ { timestamp: "Fri Mar 17 2017 13:06:09 GMT-0400 (EDT)", visitor_id: '0123456' }
//  ]}
// };

// Url public redirection
app.get('/u/:shortURL',(req,res) => {
  let longURL = urlDatabase[req.params.shortURL].long_url;
  if (longURL) {
      urlDatabase[req.params.shortURL].clicks = (urlDatabase[req.params.shortURL].clicks || 0) + 1;
      if (!req.session["visited_" + req.params.shortURL]) {
          req.session['visited_' + req.params.shortURL] = true;   
          urlDatabase[req.params.shortURL].unique_visitors = (urlDatabase[req.params.shortURL].unique_visitors || 0) + 1;
      }
      // Initializes visits array for urls
      if (!urlDatabase[req.params.shortURL].visits) {
          urlDatabase[req.params.shortURL].visits = [];
      }
      // Set a cookie for visitor ID, if not already
      let visitor_id = (req.session.visitor_id || generateRandomString());
      if (!req.session.visitor_id) {
        req.session.visitor_id = visitor_id;
      } 
      // Register the visit
      let timestamp = new Date();
      let newVisit = { timestamp: timestamp, visitor_id: visitor_id };
      urlDatabase[req.params.shortURL].visits.push(newVisit);
      // Redirects to the page
      res.redirect(longURL);  
  } else {
      res.redirect('/');
  }
    
});

app.get('/urls/:id',(req,res) => {
    let currUser = getUser(req.session.user_id);
    let templateVars = { 
        url: urlDatabase[req.params.id],
        url_id: req.params.id,
        user: currUser
    }
    res.render('urls_show',templateVars);
});
// Registration page
app.get('/register',(req,res) => {
    res.render('url_register');
});

// REST Delete resource
app.delete('/urls/:id',(req,res) => {
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

// REST Update record
app.put('/urls/:id',(req,res) => {
    const user = getUser(req.session.user_id);
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

// New urls
app.post('/urls',(req,res) => {
    const user = getUser(req.session.user_id);
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
        req.session.user_id = userid;
        res.redirect('/urls');
    } else {
        res.sendStatus(403);
    }
});

// User registration post
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
        password: bcrypt.hashSync(req.body.password,10)
    };
    req.session.user_id = newUserID;
    res.redirect('/urls');
});

// Logout post
app.post('/logout',(req,res) => {
    if (req.session.user_id) {
        req.session = null;
    }
    res.redirect('/urls');
})

app.listen(PORT,() => {
    console.log(`Running and listening on port ${PORT}`);
})