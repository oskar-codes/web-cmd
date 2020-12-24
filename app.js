window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
})

let app = new Vue({
  el: '#app',
  data: {
    isSignedIn: false,
    devices: [],
    panel: 'devices'
  }
});

firebase.auth().onAuthStateChanged(user => { // auto login
  if (user) {
    app.isSignedIn = true;
  } else {
    app.isSignedIn = false;
  }
});

function login() {
  const email = document.querySelectorAll('input')[0].value;
  const password = document.querySelectorAll('input')[1].value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((user) => {
      
    })
    .catch((error) => {
      console.log(error);
    });
}

async function updateDevices() {

  app.devices = [];

  let ref = firebase.database().ref('ping').push();
  let key = ref.key;
  ref.set({
    type: 'device_query'
  }).then((snap) => {
    firebase.database().ref(`ping/${key}/responses`).on('value', (snap) => {
      if (snap.val()) {
        const name = Object.values(snap.val())[0];
        if (name.trim()) {
          app.devices.push(name);
        }
      }
    });
  });

  await delay(5e3);

  firebase.database().ref('ping').set({});
  firebase.database().ref('/').off();
}

function openDevice(device) {
  app.panel = 'console';
  app.connectedDevice = device;
  firebase.database().ref('/').off();
  firebase.database().ref(`connections/${device}/responses/`).on('child_added', (snap) => {
    if (snap.val()) {
      const log = document.querySelector('#log');
      log.innerHTML += snap.val().replace(/\n/g, '<br>') + '<hr>';
      log.scrollBy(0, 99999);
    }
  });
}

const consoleInput = document.querySelector('#console-input');
consoleInput.addEventListener('keyup' , (e) => {
  if (e.key === 'Enter') {
    console.log('sending...');
    const command = consoleInput.value;
    const ref = firebase.database().ref(`connections/${app.connectedDevice}/commands/`).push();
    ref.set(command);
  }
});

const delay = ms => new Promise(res => setTimeout(res, ms));