/* global $, io */

// Initialize variables
const $window = $(window);
const $document = $(document);
const $messages = $('.messages'); // Messages area
const $messageInput = $(".message-input input"); // Input message input box

$(() => {
    // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  // var $currentInput = $usernameInput.focus();
  
  const socket = io();
  $messages.animate({ scrollTop: $document.height() }, "fast");
  
  // Sets the client's username
  const setUsername = () => {
    username = 'Pashqa!';//cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      // $loginPage.fadeOut();
      // $chatPage.show();
      // $loginPage.off('click');
      // $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  };

  const addParticipantsMessage = (data) => {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    // log(message);
    console.log(message);
  };
  
  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    console.log(data);
  };
  
  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    console.log(data);
    // getTypingMessages(data).fadeOut(() => {
    //   $(this).remove();
    // });
  };
  
  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    console.log(data);
    // data.typing = true;
    // data.message = 'is typing';
    // addChatMessage(data);
  };

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    console.log(message);
    // log(message, {
    //   prepend: true
    // });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    // log(data.username + ' joined');
    console.log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    // log(data.username + ' left');
    console.log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    // log('you have been disconnected');
    console.log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    // log('you have been reconnected');
    console.log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    // log('attempt to reconnect has failed');
    console.log('attempt to reconnect has failed');
  });

  setUsername();

});


$("#profile-img").click(function() {
  $("#status-options").toggleClass("active");
});

$(".expand-button").click(function() {
  $("#profile").toggleClass("expanded");
  $("#contacts").toggleClass("expanded");
});

$("#status-options ul li").click(function() {
  $("#profile-img").removeClass();
  $("#status-online").removeClass("active");
  $("#status-away").removeClass("active");
  $("#status-busy").removeClass("active");
  $("#status-offline").removeClass("active");
  $(this).addClass("active");

  if ($("#status-online").hasClass("active")) {
    $("#profile-img").addClass("online");
  }
  else if ($("#status-away").hasClass("active")) {
    $("#profile-img").addClass("away");
  }
  else if ($("#status-busy").hasClass("active")) {
    $("#profile-img").addClass("busy");
  }
  else if ($("#status-offline").hasClass("active")) {
    $("#profile-img").addClass("offline");
  }
  else {
    $("#profile-img").removeClass();
  }

  $("#status-options").removeClass("active");
});

function newMessage() {
  var message = $messageInput.val();
  if ($.trim(message) == '') {
    return false;
  }
  $('<li class="sent"><img src="http://emilcarlsson.se/assets/mikeross.png" alt="" /><p>' + message + '</p></li>').appendTo($('.messages ul'));
  $messageInput.val(null);
  $('.contact.active .preview').html('<span>You: </span>' + message);
  $messages.animate({ scrollTop: $document.height() }, "fast");
}

$('.submit').click(function() {
  newMessage();
});

$window.keydown(event => {
  // Auto-focus the current input when a key is typed
  if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    $messageInput.focus();
  }
  if (event.which == 13) {
    newMessage();
    event.preventDefault();
  }
});
