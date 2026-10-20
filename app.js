const pb = new PocketBase(PB_URL);

const loginBtn = document.getElementById("login-button");
const logoutBtn = document.getElementById("logout-button");
const accountName = document.getElementById("account-name");
const loggedIn = document.getElementById("logged-in-panel");

if (pb.authStore.isValid) {
    loginBtn.className = "hidden";
    loggedIn.className = "logged-in-panel";
    accountName.innerText = pb.authStore.record.name;
}

logoutBtn.addEventListener("click", ((e) => {
    pb.authStore.clear();
    window.location.reload();
}))


loginBtn.addEventListener("click", ((e) => {
    window.location.replace("/login.html");
}))


document.getElementById("create-button").addEventListener("click", ((e) => {
    console.log(pb.authStore.record.id);
    const body = {
        "name": "New Mesh",
        "public": false,
        "creator": pb.authStore.record.id,
    };
    pb.collection('models').create(body).then((record) => {
        window.location.replace("/edit.html?id="+record.id);
    });
}));