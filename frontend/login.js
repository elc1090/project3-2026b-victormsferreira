const pb = new PocketBase(PB_URL);


var loginScreen = document.getElementById("login-box");
var signupScreen = document.getElementById("signup-box");
var loginBtn = document.getElementById("login-button");
var goSignupBtn = document.getElementById("goto-signup-button");
var signupBtn = document.getElementById("signup-button");
var backToLoginBtn = document.getElementById("back-to-login-button")

goSignupBtn.addEventListener("click", ((e) => {
    loginScreen.className = "hidden";
    signupScreen.className = "center-container";
}));

backToLoginBtn.addEventListener("click", ((e) => {
    loginScreen.className = "center-container";
    signupScreen.className = "hidden";
}))

loginBtn.addEventListener("click", ((e) => {
    pb.collection("users").authWithPassword(
        document.getElementById("loginemail").value,
        document.getElementById("loginpassword").value).then((e) => {
            window.location.replace("/index.html");
        });
}));

document.getElementById("create-button").addEventListener("click", ((e) => {

}));

signupBtn.addEventListener("click", ((e) => {
    const signupRequest = {
        "email": document.getElementById("signupemail").value,
        "emailVisibility": false,
        "name": document.getElementById("signupname").value,
        "password": document.getElementById("signuppassword").value,
        "passwordConfirm": document.getElementById("signuppasswordconfirm").value
    };
    pb.collection('users').create(signupRequest).then((record) => {
        pb.collection("users").authWithPassword(
            document.getElementById("signupemail").value,
            document.getElementById("signuppassword").value).then((e) => {
                window.location.replace("/index.html");
            });
    });
}));
