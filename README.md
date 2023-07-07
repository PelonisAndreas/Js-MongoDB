# Js-mongodb
A simple gaming conventions website which offers many user/admin services connected to a mongo database.


The current project was created for the university class 'Web Programming'. The website changes dynamically depending on the user's device, which includes different font sizes, header sizes, body sizes, etc. The website features a login/signup feature, storing user information in a MongoDB collection. Users have access to their profiles where they can view and modify their information. They can also access all web pages to view and search for events, except for the buy-ticket page, which requires them to be logged in. On the buy-ticket page, users are offered a selection of tickets to purchase (up to a maximum of 4) and three types of tickets to choose from. They also have the option to select their preferred seats in the room. Additionally, there is an option to change the theme of the pages to Dark Mode and back.

The admin of the website has access to the admin main page, which allows them to navigate to other admin pages or the "user pages" to see the changes they have made in effect. The other admin pages provide the ability to view and modify user information, create new users or delete existing ones, create/delete events, and modify event information. When a user is deleted, their corresponding reservation is also deleted, as well as when an event is deleted. Furthermore, there is an admin page that displays reservations, allowing the admin to change the type of tickets, thereby altering the total price the user has to pay.
The technologies used are:
Node.js, Express.js, EJS (Embedded JavaScript), JavaScript, HTML, CSS, MongoDB
