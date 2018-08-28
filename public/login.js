/* global $ */
$(() => {
    const $inputName = $('#inputName');
    const $inputNick = $('#inputNick');
    const $inputPass = $('#inputPass');
    
    const $buttonSignin = $('#buttonSignin');
    $buttonSignin.click((event) => {
        event.preventDefault();
        $.post("/login", {
            nickname: $inputNick.val(),
            password: $inputPass.val()
        }, function(data) {
            if (!data.error) {
                window.location.href = "/";
            }
            else {
                alert(data.message);
            }
        });
    });
    
    const $buttonRegister = $('#buttonRegister');
    $buttonRegister.click((event) => {
        event.preventDefault();
        $.post("/register", {
            fullname: $inputName.val(),
            nickname: $inputNick.val(),
            password: $inputPass.val(),
        }, function(data) {
            if (!data.error) {
                window.location.href = "/";
            }
            else {
                alert(data.message);
            }
        });
      
    });        
    
    const $registerSinginToggler = $('.register-singin-toggler');
    $registerSinginToggler.click((event) => {
       event.preventDefault();
       
       const registerSinginTogglerText = $.trim($registerSinginToggler.text());
       
       if (registerSinginTogglerText === 'Register') {
           $buttonSignin.hide();
           $inputName.show();
           $buttonRegister.show();
           $registerSinginToggler.text('Signin');
       } else {
           $inputName.hide();
           $buttonRegister.hide();
           $buttonSignin.show();
           $registerSinginToggler.text('Register');           
       }
       
    });
    
   
    
});