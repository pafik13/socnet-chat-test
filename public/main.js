/* global $, io */

// $('li.contact').map((i, el) => $(el).attr('data-room-key'));
$(() => {
  const FADE_TIME = 150; // ms
  const TYPING_TIMER_LENGTH = 400; // ms
  
  // Initialize variables
  const $window = $(window);
  const $document = $(document);
  const $chooseContanct = $('.content > p');
  const $messages = $('.messages'); // Messages area
  const $messagesList = $messages.find('ul'); // Messages list
  const $input = $('.message-input');
  const $messageInput = $input.find('input'); // Input message input box
  const $contacts = $('#contacts'); // Contacts container
  var $currentContact = null;
  const $contactProfile = $('.contact-profile'); // Profile above messages
  const $logout = $('#logout');
  
  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  // var $currentInput = $usernameInput.focus();
  
  const sendStopTyping = () => {
    const room_key = $currentContact.attr('data-room-key');
    socket.emit('stop typing', {
      room_key: room_key
    });
    typing = false;
  };
  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        const room_key = $currentContact.attr('data-room-key');
        socket.emit('typing', {
          room_key: room_key
        });
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          sendStopTyping();
        }
      }, TYPING_TIMER_LENGTH);
    }
  };

  $messageInput.on('input', () => {
    updateTyping();
  });
  
  const socket = io();
  // $messages.animate({ scrollTop: $document.height() }, "fast");

  // Sets the client's username
  const setUsername = () => {
    username = 'Pashqa!'; //cleanInput($usernameInput.val().trim());

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
    }
    else {
      message += "there are " + data.numUsers + " participants";
    }
    // log(message);
    console.log(message);
  };

  // Adds the visual chat message to the message list
  const recieveChatMessage = (data) => {
    console.log(data);
    if (data.room_key) {
      const roomKey = $.trim(data.room_key);
      const message = $.trim(data.message);
      const currentRoomKey = $currentContact == null ? null : $currentContact.attr('data-room-key');
      if (roomKey == currentRoomKey) {
        $('<li class="replies"><img src="http://emilcarlsson.se/assets/harveyspecter.png" alt="" /><p>' + message + '</p></li>').appendTo($messagesList);
        $currentContact.find('.preview').text(message);
        // $('.contact.active .preview').html(message);
        // $messages.animate({ scrollTop: $document.height() }, "fast");
        $messages.scrollTop($messages[0].scrollHeight);
      } else {
        $contacts
          .find('li[data-room-key="'+roomKey+'"]')
          .find('.preview')
          .text(message);
      }
    } else {
      console.error('`data.room_key` is undefined');
    }
  };

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    console.log('removeChatTyping', data);
    if (data.room_key) {
      const roomKey = data.room_key;
      $contacts
        .find('li[data-room-key="'+roomKey+'"]')
        .find('.typing')
          .hide()
          .end()
        .find('.preview')
        .show();
    }
  };

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    console.log('addChatTyping', data);
    if (data.room_key) {
      const roomKey = data.room_key;
      $contacts
        .find('li[data-room-key="'+roomKey+'"]')
        .find('.preview')
          .hide()
          .end()
        .find('.typing')
        .show();
    }
  };
  
  const addContact = (roomKey, user) => {
    const wrap = $('<div class="wrap"></div>')
      .append($('<span class="contact-status online"></span>'))
        .end()
      .append($('<img>').attr('src', user.icon));
    
    const meta = $('<div class="meta"></div>')
      .append($('<p class="name"></p>').text(user.name || user.nick))
        .end()
      .append($('<p class="typing" style="display:none"><i class="fa fa-pencil" aria-hidden="true"></i>typing...</p>'))
        .end()
      .append($('<p class="preview"><span>No messages yet...</span> %></p>'));
    
    const contact = $('<li></li>')
      .addClass('contact')
      .attr('data-room-key', roomKey)
      .append(wrap.append(meta));
    
    $contacts.find('ul').append(contact);
                  // <li class="contact" data-room-key="<%=contacts[i].room_key%>">
                  //     <div class="wrap">
                  //         <span class="contact-status"></span>
                  //         <% if (contacts[i].icon) { %>
                  //           <img src="<%=contacts[i].icon%>" alt="">
                  //         <% } else { %>
                  //           <i class="fa fa-user fa-3x" aria-hidden="true"></i>
                  //         <% } %>
                  //         <div class="meta">
                  //             <p class="name"><%=contacts[i].name || contacts[i].nick %></p>
                  //             <p class="typing" style="display:none"><i class="fa fa-pencil" aria-hidden="true"></i>typing...</p>
                  //             <% if (contacts[i].room_last_message) { %>
                  //               <p class="preview">
                  //                 <% if (contacts[i].created_by == user.id) { %> <span>You: </span> <% } %>
                  //                 <%=contacts[i].room_last_message %>
                  //               </p>
                  //             <% } else { %>
                  //               <p class="preview"><span>No messages yet...</span> %></p>
                  //             <% } %>  
                  //         </div>
                  //     </div>
                  // </li>
  };
  
  
  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    connected = true;
    console.log(data);
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    console.log(message);
    // log(message, {
    //   prepend: true
    // });
    addParticipantsMessage(data);
    // $('li.contact').each((el) => {
    //   socket.join($(el).attr('data-room-key'), ()=>{
    //     console.log(socket.rooms);
    //   });
    // });
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    recieveChatMessage(data);
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

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('invited', (data) => {
    console.log('invited', data);
    addContact(data.room_key, data.user);
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




  
  $("#profile-img").click(function() {
    $("#status-options").toggleClass("active");
  });
  
  $(".expand-button").click(function() {
    $("#profile").toggleClass("expanded");
    $("#contacts").toggleClass("expanded");
  });
  
  $("#status-options ul li").click(function() {
    const $this = $(this);
    if ($this.is($logout)) {
      window.location.href = "/logout";
      return;
    }

    $("#profile-img").removeClass();
    $("#status-online").removeClass("active");
    $("#status-away").removeClass("active");
    $("#status-busy").removeClass("active");
    $("#status-offline").removeClass("active");
    $this.addClass("active");
  
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
  
  function sendMessage() {
    var message = $messageInput.val();
    if ($.trim(message) == '') {
      return false;
    }
    
    $('<li class="sent"><img src="http://emilcarlsson.se/assets/mikeross.png" alt="" /><p>' + message + '</p></li>').appendTo($messagesList);
    $messageInput.val(null);
    $('.contact.active .preview').html('<span>You: </span>' + message);
    $messages.animate({ scrollTop: $document.height() }, "fast");
    // tell server to execute 'new message' and send along one parameter
    var room_key = $currentContact.attr('data-room-key');
    socket.emit('new message', {
      room_key: room_key,
      message: message,
    });
  }
  
  $('.submit').click(function() {
    sendMessage();
  });
  
  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $messageInput.focus();
    }
    if (event.which == 13) {
      sendStopTyping();
      sendMessage();
      event.preventDefault();
    }
  });



  setUsername();
  // $messages.animate({ scrollTop: $document.height() });
  $messages.scrollTop($messages[0].scrollHeight);

  var OnLoadFinished = function() {
    $chooseContanct.hide();
    $contactProfile.show();
    $messages.show();
    $input.show();
    $messages.scrollTop($messages[0].scrollHeight);
  };

  $('li.contact').on('click', function() {
    var $this = $(this);
    if ($this.hasClass('active')) {
      console.log(this);
      return;
    }
    
    $this
      .addClass('active')
      .siblings()
      .removeClass('active');
    
    $currentContact = $this;

    $messages.hide();
    $input.hide();

    const name = $this.find('p.name').text();
    $contactProfile
      .find('p')
      .text(name);
      
    const img = $this.find('img');
    if (img.length) {
      const profileImg = $contactProfile.find('img');
      if (profileImg.length) {
        profileImg.attr('src', img.attr('src'));
      } else {
        $contactProfile.find('i').remove();
        img.clone().prependTo($contactProfile);
      }
    } else {
      const profileImg = $contactProfile.find('img');
      if (profileImg.length) {
        profileImg.remove();
        $contactProfile.prepend($('<i class="fa fa-user fa-3x" aria-hidden="true"></i>'));
      }
    }
    
        
    const roomKey = $this.attr('data-room-key');
    console.log(roomKey);
    $messagesList.load('/messages?room_key='+roomKey, OnLoadFinished);
    
  });
  
  
  const $addContact = $('#addcontact');
  const $modal = $('#modal-form');
  const $modalClose = $modal.find('span.close');
  const $modalHeader = $modal.find('.modal-header h2');
  const $modalBody = $modal.find('.modal-body');
  const $modalFooter = $modal.find('.modal-footer h3');
  
  $addContact.click((event)=>{
    $modalHeader.text('Adding new contact');
    $modalBody
      .children()
        .remove()
        .end()
      .append('<input type="text" placeholder="Write nick here..." value=""></input>');
    const $addContactInput = $modalBody.find('input');
    $modalFooter.text('New Text');
    $input.hide();
    $modal.show();
    
    
    $addContactInput.on('input', () => {
      const nickPart = $addContactInput.val();
      if (nickPart.length > 3) {
        $modalFooter.load('/unused-contacts?nick_part=' + nickPart, () => {
          $modalFooter.find('li').click((event) => {
            // console.log(this);
            const $li = $(event.target);
            const userId = $li.attr('data-user-id');
            console.log(userId);
            if (userId) {
              $.post("/invite-user", {
                partner_id: userId,
              }, function(data) {
                if (!data.error) {
                  const user = {
                    id: userId,
                    name: $li.attr('data-user-name'),
                    nick: $li.attr('data-user-nick'),
                    icon: $li.attr('data-user-icon'),
                  };
                  addContact(data.room_key, user);
                  $modalClose.trigger('click');
                } else {
                  alert(data.message);
                }
              });
            }
          });
        });
      }
    });
  });
  
  $window.click((event)=>{
    if ($(event.target).is($modal)) {
      $modalClose.trigger('click');
    }
  });
  
  $modalClose.click((event)=>{
    $input.show();
    $modal.hide();
  });
  
});
