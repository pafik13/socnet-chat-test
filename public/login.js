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
    
});