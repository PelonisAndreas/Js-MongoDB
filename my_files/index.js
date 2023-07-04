const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { log } = require('console');
const { v4: uuidv4 } = require('uuid');





const app = express();
const port = 3000;

// Connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'test2';


//set the view engine to EJS
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile); //register both .html and .ejs files for rendering

// Middleware to parse the request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Configure session middleware
app.use(
  session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static files from the "other" directory
app.use(express.static(path.join(__dirname, 'other')));


// Set res.locals based on the value of req.session so it can be accessed by ejs
app.use(function(req, res, next) {
  res.locals.loggedIn = req.session.loggedIn || false; // if `req.session.loggedIn` is not set, it defaults to `false`
  next();
});

var username = ''; //set a var here to have a global scope
var email='';
var password='';
var phone ='';

// Serve the HTML files
app.get('/', (req, res) => {

    res.render(path.join(__dirname, 'homeT.html'), { loggedIn: res.locals.loggedIn, username: req.session.username}); //render `homeT.html` using ejs. Additional data, `loggedIn` & `username`, are passes to the view
});

app.get('/homeAdmin.html', (req, res) => {
  res.render(path.join(__dirname, 'homeAdmin.html'), { loggedIn: res.locals.loggedIn, username: req.session.username}); 

});

app.get('/About.html', async (req, res) => {

  try {
    // Connect to the MongoDB server
    await client.connect();
    
  
    const db = client.db(dbName);
    const collection = db.collection('info');
  
    var info = await collection.findOne({});
    
    res.render(path.join(__dirname, 'About.html'), { loggedIn: res.locals.loggedIn,  info:info , username:req.session.username});
  
 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    // Close the MongoDB connection
    client.close();
  }


});




app.get('/profile.html', (req, res) => {
  if (req.session.loggedIn) {
    res.render(path.join(__dirname, 'profile.html'), { loggedIn: res.locals.loggedIn, name:req.session.name, username: req.session.username, user_email: req.session.email, user_password: req.session.password, user_phone:req.session.phone});
  } else {
    res.redirect('/');
  }
});




// Handle the sign-up form submission
app.post('/sign_up', async (req, res) => {
  var role = req.query.role;
 

  var userData = {
    username:'',
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
  };


  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Generate username based on the name input
    userData.username = req.body.name.toLowerCase().replace(/\s+/g, '');
    usernameExists = await collection.findOne({ username: userData.username });

    let count = 1;
    while (usernameExists) {
      // If the username exists, add a number to make it qunique
      userData.username = req.body.name.toLowerCase().replace(/\s+/g, '') + count;
      usernameExists = await collection.findOne({ username: userData.username });
      count++;
    }

    // Insert the user data into the collection
    const insertResult = await collection.insertOne(userData);
    console.log('Inserted document:', insertResult);
    console.log("Sign-up was succesful");

  

    if (role !== 'admin'){
      const user = await collection.findOne({ username: userData.username, password: userData.password });
      req.session.loggedIn = true; // After inserting the user data, set the session's variables
      req.session.id = user._id;
      req.session.name = user.name;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.password = user.password;
      req.session.phone = user.phone;
    

    res.redirect('/'); //After sign-up go back to root
    }
    else{
    res.redirect('updateUsers.html');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while registering the user.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});

// Handle the login form submission
app.post('/log_in', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const previousURL = req.body.previousURL || req.query.previousURL || '/';


  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Find the user with the matching name and password
    const user = await collection.findOne({ username: username, password: password });

    if (user) {
      req.session.loggedIn = true; // After inserting the user data, set the session's variables
      req.session.id = user._id;
      req.session.name = user.name;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.password = user.password;
      req.session.phone = user.phone;
      console.log('User logged-in succesfully');
      
      if (user.username == 'admin'){
        res.redirect('/homeAdmin.html');
      }
      else{
        res.redirect(previousURL);
      }

      
    } else {
      // Invalid name or password, display an error message
      console.log('Wrong name or password');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while logging in.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});


// Handle the profile update form submission
app.post('/update_profile', async (req, res) => {
  const username = req.body.username;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Update the user data in the collection
    await collection.updateOne(
      { username: req.session.username }, // Find the user by their previous username
      { $set: { name, email, password, phone } } // Update the user's data
    );

    // Update the info of the session
    req.session.username = username; 
    req.session.name = name; 
    req.session.password = password;
    req.session.email = email;
    req.session.phone= phone;

    console.log('User profile updated successfully');
    res.redirect('/'); // Redirect to the updated profile page
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while updating the profile.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});


app.get('/events.html', async (req, res) => {
 // res.render(path.join(__dirname, 'events.html'), { loggedIn: res.locals.loggedIn, username: req.session.username});

  try {
    // Connect to the MongoDB servera
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('events');

    //get active events
    var activeEvents = await collection.find({ active: '1' }).toArray();

    //get inactive events
    var inactiveEvents = await collection.find({ active: '0' }).toArray();

    res.render(path.join(__dirname, 'events.html'), { loggedIn: req.session.loggedIn, username: req.session.username, activeEvents: activeEvents, inactiveEvents: inactiveEvents});

  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred while retrieving events.');
  } finally {
      // Close the MongoDB connection
      client.close();
  }

});


app.get('/event-info.html', async (req, res) => {
  var name = req.query.event_name;

  try {
    // Connect to the MongoDB server
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('events');

    const event = await collection.findOne({ name: (name) });

    if (!event) {
      // Event not found
      return res.status(404).send('Event not found');
    }

    res.render(path.join(__dirname, 'event-info.html'), { loggedIn: res.locals.loggedIn, username: req.session.username, event: event });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while retrieving the event.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});



app.get('/buy_tickets.html', async (req, res) => {
  var username = req.query.user_name;
 

  try {
    // Connect to the MongoDB server
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('users');

    const event = await collection.findOne({ username: (username) });

    if (!event) {
      // Event not found
      return res.status(404).send('User is not logged in');
    }

    res.render(path.join(__dirname, 'buy_tickets.html'), { loggedIn: res.locals.loggedIn, username: req.session.username, event: event });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while retrieving the event.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});

app.get('/updateUsers.html', async (req, res) => {
  if (req.session.loggedIn) {
    
    try {
      // Connect to the MongoDB server
      await client.connect();
  
      const db = client.db(dbName);
      const collection = db.collection('users');
  
      const users = await collection.find({}).toArray();
  
  
      res.render(path.join(__dirname, 'updateUsers.html'), { loggedIn: res.locals.loggedIn, users: users , username: req.session.username });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred ');
    } finally {
      // Close the MongoDB connection
      client.close();
    }

  } else {
    res.redirect('/');
  }
});


// Handle the ticket submission
app.post('/submit_seats', async (req, res) => {
  //Get the parameters from the url
  var user_name = req.query.username;
  var event_name = req.query.eventname;
  var seat_data = req.body.seat_data;


  try {
    // Connect to the MongoDB server
    await client.connect();
    

    const db = client.db(dbName);
    const collection = db.collection('reservations');

    // Generate a random unique ID
    var ep = uuidv4();


    //find a document in the collection
    var reservation = await collection.find({ $and: [{ username: user_name }, { eventname: event_name }] }).toArray();
    
    if(reservation.length == 0){
      await collection.insertOne({ id: ep ,seats: seat_data.seatsIndex, username: user_name, eventname: event_name, total_price: seat_data.totalPrice, ticket_amount: seat_data.selectedSeatsCount, ticket_type: seat_data.ticketType });
    }
    else{
      await collection.updateOne(
        { username: user_name },
        { $set: { seats: seat_data.seatsIndex, total_price: seat_data.totalPrice, ticket_amount: seat_data.selectedSeatsCount, ticket_type: seat_data.ticketType } }
      );
    }
    

    console.log('Seats index stored in the database');
    res.json({ message: 'Seats index received and stored successfully' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while storing the seats index' });
  } finally {
    // Close the MongoDB connection
    client.close();
  }

 
});

app.get('/updateUserprofile.html', async (req, res) => {
 var username = req.query.username;

 try {
  // Connect to the MongoDB server
  await client.connect();
  

  const db = client.db(dbName);
  const collection = db.collection('users');

  var user = await collection.findOne({username: username});
  
  res.render(path.join(__dirname, 'updateUserprofile.html'), { loggedIn: res.locals.loggedIn,  user:user , username:req.session.username});

  

  
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'An error occurred' });
} finally {
  // Close the MongoDB connection
  client.close();
}
  
});

app.post('/updateUserProfile', async (req, res) => {
  const username = req.body.username;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Update the user data in the collection
    await collection.updateOne(
      { username: username }, // Find the user by their username
      { $set: { username, name, email, password, phone } } // Update the user's data
    );

    console.log('User profile updated successfully');
    res.redirect('/updateUsers.html'); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while updating the profile.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});

app.get('/deleteUser', async (req, res) => {
  var username = req.query.username;
 
  try {
    // Connect to the MongoDB server
    await client.connect();
   
 
    const db = client.db(dbName);
    const usersColl = db.collection('users');
    const reservationsColl = db.collection('reservations');


    const result = await usersColl.deleteOne({username: username});

    //when the user is deleted, delete all the reservations that he made
    const result2 = await reservationsColl.deleteMany({username: username});

    if (result.deletedCount === 1) {
      console.log('User deleted successfully.');
      res.redirect('/updateUsers.html');
    } else {
      console.log('User not found.');
    }

 
   
 
   
 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});


app.get('/eventSearch.html', async (req, res) => {
  // res.render(path.join(dirname, 'events.html'), { loggedIn: res.locals.loggedIn, username: req.session.username});
   try {
     // Connect to the MongoDB servera
     await client.connect();
     console.log('Connected successfully to server');

     const db = client.db(dbName);
     const collection = db.collection('events');

     //get active events
     var searchQuery = await collection.find({}).toArray();

     res.render(path.join(__dirname, 'eventSearch.html'), { loggedIn: res.locals.loggedIn, username: req.session.username, searchq: searchQuery});
   } catch (error) {
       console.error('Error:', error);
       res.status(500).send('An error occurred while retrieving events.');
   } finally {
       // Close the MongoDB connection
       client.close();
   }
 
});
 
app.get('/getSearchQuery', async (req,res) =>{
  var searchq = req.query.searchq;

  try {
    // Connect to the MongoDB server
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('events');

    // Update the user data in the collection
  var searchQuery = await collection.find({ name: {$regex : searchq } }).toArray();


  if (!searchQuery) {
    // Event not found
    return res.status(404).send('User is not logged in');
  }
    console.log(searchQuery);


    res.render(path.join(__dirname, 'eventSearch.html'), { loggedIn: res.locals.loggedIn, username: req.session.username, searchq: searchQuery});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while updating the profile.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
}); 

app.get('/updateEvent.html', async (req, res) => {
  if (req.session.loggedIn) {
    
    try {
      // Connect to the MongoDB server
      await client.connect();
  
      const db = client.db(dbName);
      const collection = db.collection('events');
  
      const events = await collection.find({}).toArray();
  
  
      res.render(path.join(__dirname, 'updateEvent.html'), { loggedIn: res.locals.loggedIn, events:events , username: req.session.username });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred ');
    } finally {
      // Close the MongoDB connection
      client.close();
    }

  } else {
    res.redirect('/');
  }
});


app.get('/updateEventInfo.html', async (req, res) => {
  var eventname = req.query.eventname;
 
  try {
   // Connect to the MongoDB server
   await client.connect();
   
 
   const db = client.db(dbName);
   const collection = db.collection('events');
 
   var event = await collection.findOne({name: eventname});
   
   res.render(path.join(__dirname, 'updateEventInfo.html'), { loggedIn: res.locals.loggedIn,  event:event , username:req.session.username});
 
   
 
   
 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});

app.post('/updateEventInfo', async (req, res) => {
  const filter = req.query.eventname

  const name = req.body.name;
  const active = req.body.active;
  const date = req.body.date;
  const info = req.body.info;
  const hours = req.body.hours;
  const url = req.body.url;
  const map_url = req.body.map_url;

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('events');

    // Update the event in the collection
    await collection.updateOne(
      { name: filter }, // Find the event by its name
      { $set: { name, active, date, info, hours, url, map_url } } // Update the event
    );

    console.log('Event updated successfully');
    res.redirect('/updateEvent.html'); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while updating the profile.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});

app.get('/deleteEvent', async (req, res) => {
  var eventname = req.query.eventname;
 
  try {
    // Connect to the MongoDB server
    await client.connect();
   
 
    const db = client.db(dbName);
    const eventColl = db.collection('events');
    const reservationsColl = db.collection('reservations');


    //when the event is deleted, delete all the reservations which include that event
    const result2 = await reservationsColl.deleteMany({eventname: eventname});
    const result = await eventColl.deleteOne({name: eventname});

    if (result.deletedCount === 1) {
      console.log('Event deleted successfully.');
      res.redirect('/updateEvent.html');
    } else {
      console.log('Event not found.');
    }
 
   
 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});
 


// Handle the event creation 
app.post('/createEvent', async (req, res) => {
  var event = {
    name: req.body.name,
    active: req.body.active,
    date: req.body.date,
    info: req.body.info,
    hours: req.body.hours,
    url: req.body.url,
    map_url: req.body.map_url
  };


  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('events');

    // Insert the event into the collection
    const insertResult = await collection.insertOne(event);
    console.log('Inserted document:', insertResult);
    console.log("Event creation was succesful");

  

  

    res.redirect('/updateEvent.html'); 


  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while creating the event.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});


app.get('/updateReservation.html', async (req, res) => {
  if (req.session.loggedIn) {
    
    try {
      // Connect to the MongoDB server
      await client.connect();
  
      const db = client.db(dbName);
      const collection = db.collection('reservations');
  
      const reservations = await collection.find({}).toArray();
  
  
      res.render(path.join(__dirname, 'updateReservation.html'), { loggedIn: res.locals.loggedIn, reservations:reservations , username: req.session.username });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred ');
    } finally {
      // Close the MongoDB connection
      client.close();
    }

  } else {
    res.redirect('/');
  }
});

app.get('/deleteReservation', async (req, res) => {
  var id = req.query.id;
 
 
  try {
    // Connect to the MongoDB server
    await client.connect();
   
 
    const db = client.db(dbName);
    const reservationsColl = db.collection('reservations');

    //when the user is deleted, delete all the reservations that he made
    const result = await reservationsColl.deleteMany({id:id});

    if (result.deletedCount === 1) {
      console.log('Reservation deleted successfully.');
      res.redirect('/updateReservation.html');
    } else {
      console.log('Reservation not found.');
    }

 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});

app.get('/updateReservationInfo.html', async (req, res) => {
  var id = req.query.id;
 
  try {
   // Connect to the MongoDB server
   await client.connect();
   
 
   const db = client.db(dbName);
   const collection = db.collection('reservations');
 
   var reservations = await collection.findOne({id: id});
   
   res.render(path.join(__dirname, 'updateReservationInfo.html'), { loggedIn: res.locals.loggedIn,  reservations: reservations , username:req.session.username});
 
   
 
   
 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});


app.post('/updateReservationInfo', async (req, res) => {
  const id = req.query.id

  const seats = req.body.seats;
  const username = req.body.username;
  const eventname = req.body.eventname;
  const ticket_type = req.body.ticket_type;
  const ticket_amount = req.body.ticket_amount;
  var total_price=0;
  

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('reservations');

    if(ticket_type==='normal')
    {
      total_price = 10*ticket_amount;
    }
    else if (ticket_type==='extra'){
      total_price = 20*ticket_amount;
    }
    else if (ticket_type==='premium'){
      total_price = 30*ticket_amount;
    }

    // Update the event in the collection
    await collection.updateOne(
      { id:id }, // Find the reservation
      { $set: { ticket_type: ticket_type , total_price:total_price} } // Update the reservation
    );

    console.log('Reservation updated successfully');
    res.redirect('/updateReservation.html'); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while updating the reservation.');
  } finally {
    // Close the MongoDB connection
    client.close();
  }
});

app.get('/updateAbout.html', async (req, res) => {
 
  try {
   // Connect to the MongoDB server
   await client.connect();
   
 
   const db = client.db(dbName);
   const collection = db.collection('info');
 
   var info = await collection.findOne({});
   
   res.render(path.join(__dirname, 'updateAbout.html'), { loggedIn: res.locals.loggedIn,  info:info , username:req.session.username});
 

 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});

app.post('/updateAboutInfo', async (req, res) => {
  var info = req.body.info;
 
  try {
   // Connect to the MongoDB server
   await client.connect();
   
 
   const db = client.db(dbName);
   const collection = db.collection('info');
 
   var resultInfo = await collection.find({});

   // Update the info in the collection
   await collection.updateOne(
    { }, 
    { $set: { info:info} } 
  );

  console.log("Campain's info updated successfully");
  res.redirect('/updateAbout.html'); 
   
  //res.render(path.join(__dirname, 'updateAbout.html'), { loggedIn: res.locals.loggedIn,  info:info , username:req.session.username});
 

 } catch (error) {
   console.error('Error:', error);
   res.status(500).json({ error: 'An error occurred' });
 } finally {
   // Close the MongoDB connection
   client.close();
 }
   
});


// Handle the logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});





// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});