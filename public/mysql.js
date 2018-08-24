/* global $ */
$(document).ready(function() {
  $("#username").hide();
  $('#login-submit').click(function(e) {
    if ($(this).attr('value') === 'Register') {
      $.post("/register", {
        nick: $("#nick").val(),
        name: $("#name").val(),
        pwd: $("#pwd").val()
      }, function(data) {
        if (data.error) {
          alert(data.message);
        }
        // else {
        //   $("#username").hide();
        //   $("#login-submit").prop('value', 'Log in');
        // }
      });
    }
    else {
      $.post("/login", {
        user_email: $("#useremail").val(),
        user_password: $("#password").val()
      }, function(data) {
        // if (!data.error) {
        //     window.location.href = "/";
        // }
        // else {
        //     alert(data.message);
        // }
      });
    }
  });
  $("#reg").click(function(event) {
    $("#username").show('slow');
    $("#login-submit").prop('value', 'Register');
    event.preventDefault();
  });
  
  $('#invite-user').click(function(e) {
      $.post("/invite-user", {
        user_id: $("#user_id").val(),
        partner_id: $("#partner_id").val(),
      }, function(data) {
        if (data.error) {
          alert(data.message);
        }
        // else {
        //   $("#username").hide();
        //   $("#login-submit").prop('value', 'Log in');
        // }
      });
  });
  
  $('#add-message').click(function(e) {
    $.post("/add-message", {
      room_key: $("#room_key").val(),
      message: $("#message").val(),
      user_id: $("#m-user_id").val(),
    }, function(data) {
      if (data.error) {
        alert(data.message);
      }
      // else {
      //   $("#username").hide();
      //   $("#login-submit").prop('value', 'Log in');
      // }
    });
  });
});
