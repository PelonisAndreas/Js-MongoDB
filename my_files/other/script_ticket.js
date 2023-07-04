const container = document.querySelector(".container");
const seats = document.querySelectorAll(".row .seat:not(.occupied)");
const count = document.getElementById("count");
const total = document.getElementById("total");

const attendants = document.getElementById("attendees");
var attendees = attendants.value;

const ticket1select = document.getElementById("ticket1");
const ticket2select = document.getElementById("ticket2");
const ticket3select = document.getElementById("ticket3");
var ticketType = '';
var tickets = 10;



// Update total and count
function updateSelectedCount() {
  const selectedSeats = document.querySelectorAll('.row .seat.selected');
  const selectedSeatsCount = selectedSeats.length;

  count.innerText = selectedSeatsCount;
  total.innerText = selectedSeatsCount * tickets;
}

//ticket select event
/*ticketSelect.addEventListener('change', e=>{
  ticketPrice = +e.target.value;
  updateSelectedCount();
})*/

attendants.addEventListener('click', e=>{
  attendees = document.getElementById("attendees").value;
});

ticket1select.addEventListener('click', e=>{
  tickets = document.getElementById("ticket1").value;
  ticketType = 'normal';
  updateSelectedCount();
});

ticket2select.addEventListener('click', e=>{
  tickets = document.getElementById("ticket2").value;
  ticketType = 'extra';
  updateSelectedCount();
});

ticket3select.addEventListener('click', e=>{
  tickets = document.getElementById("ticket3").value;
  ticketType = 'premium';
  updateSelectedCount();
});

let x = 0;
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('seat') && !e.target.classList.contains('occupied')) {
    if (e.target.classList.contains('selected') && x > 0) {
      x--;
      e.target.classList.toggle('selected');
    } else if (!e.target.classList.contains('selected') && x < attendees) {
      x++;
      e.target.classList.toggle('selected');
    }
  }

  updateSelectedCount();
});





// Function to send seatsIndex to the server
function sendSeatsIndex(seat_data) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const username = urlParams.get('user_name');
  const eventname = urlParams.get('event_name');
//Get the parameters from the url and fetch them in the sumbit_seats url as parameters again

  

    fetch('/submit_seats?username='+username+'&eventname='+eventname, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'seat_data': seat_data }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Seats index submitted:', data);
      })
      .catch(error => {
        console.error('Error submitting seats index:', error);
      });
}

function closePopup() {
  window.close(); // Close the pop-up window
}

function final_buy() {
  const selectedSeats = document.querySelectorAll('.row .seat.selected');

  const selectedSeatsCount = selectedSeats.length;
  const totalPrice = selectedSeatsCount * tickets;

  const seatsIndex = [...selectedSeats].map(function(seat){
      return [...seats].indexOf(seat);
  });
  
  const seat_data ={
    seatsIndex: seatsIndex,
    selectedSeatsCount : selectedSeatsCount,
    totalPrice: totalPrice,
    ticketType: ticketType

  };

 // Send seatsIndex to the server
sendSeatsIndex(seat_data);


}