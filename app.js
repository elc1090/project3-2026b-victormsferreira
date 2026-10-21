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
    window.location.replace("login.html");
}))


document.getElementById("create-button").addEventListener("click", ((e) => {
    console.log(pb.authStore.record.id);
    const body = {
        "name": "New Mesh",
        "public": false,
        "creator": pb.authStore.record.id,
    };
    pb.collection('models').create(body).then((record) => {
        window.location.replace("edit.html?id="+record.id);
    });
}));

function createPreview(m) {
    var imgURL = PB_URL+"/api/files/models/"+m.id+"/"+m.thumbnail+"?thumb=128x128f";
    var div = document.createElement("div");
    var img = document.createElement("img");
    var name = document.createElement("p");
    var creator = document.createElement("p");
    var a = document.createElement("a");
    var a2 = document.createElement("a");
    if (!pb.authStore.valid || m.creatorID != pb.authStore.record.id) {
        a.href = "edit.html?id="+m.id+"&preview=true";
    } else {
        a.href = "edit.html?id="+m.id;
    }
    div.className = "preview";
    img.src = imgURL;
    creator.innerText = m.creator;
    name.innerText = m.name;
    creator.style.fontSize = "smaller";
    creator.style.fontStyle = "italic";
    a2.href = "user.html?id="+m.creator;
    a.appendChild(img);
    a.appendChild(name);
    a2.appendChild(creator);
    div.appendChild(a);
    div.appendChild(a2);
    return div;
}

async function loadFrontpage() {
    const previewsContainer = document.getElementById("previews-container");
    var fp = await pb.send("/frontpage");
    for (var m of fp) {
        var preview = createPreview(m);
        previewsContainer.appendChild(preview);
    }
    console.log(fp);
}

async function loadUserpage() {
    const searchParams = new URLSearchParams(window.location.search);
    var userid = searchParams.get("id");
    const previewsContainer = document.getElementById("previews-container");
    var fp = await pb.send("/user/"+userid+"/models");
    for (var m of fp) {
        var preview = createPreview(m);
        previewsContainer.appendChild(preview);
    }
    document.getElementById("name-header").innerText = userid;
    console.log(fp);
}
