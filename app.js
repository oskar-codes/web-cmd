const usr = () => firebase.auth().currentUser

window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
})

let app = new Vue({
  el: '#app',
  data: {
    isSignedIn: false,
    devices: [],
    panel: 'devices',
    logging: true,
    email: ''
  }
});

firebase.auth().onAuthStateChanged(user => { // auto login
  if (user) {
    app.isSignedIn = true;
    app.email = user.email;
  } else {
    app.isSignedIn = false;
    app.email = '';
  }
});

function login() {
  const email = document.querySelectorAll('.login input')[0].value;
  const password = document.querySelectorAll('.login input')[1].value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((user) => {
      
    })
    .catch((error) => {
      console.log(error);
    });
}

function signup() {
  const email = document.querySelectorAll('.signup input')[0].value;
  const password = document.querySelectorAll('.signup input')[1].value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
}

async function updateDevices() {

  app.devices = [];

  let ref = firebase.database().ref(`ping/${usr().uid}`).push();
  let key = ref.key;
  ref.set({
    type: 'device_query'
  }).then((snap) => {
    firebase.database().ref(`ping/${usr().uid}/${key}/responses`).on('value', (snap) => {
      if (snap.val()) {
        const name = Object.values(snap.val())[0];
        if (name.trim()) {
          app.devices.push(name);
        }
      }
    });
  });

  await delay(9999e3);

  firebase.database().ref(`ping/${usr().uid}`).set({});
  firebase.database().ref('/').off();
}

function openDevice(device) {
  app.panel = 'console';
  app.connectedDevice = device;
  firebase.database().ref('/').off();
  const log = document.querySelector('#log');
  const dashboard = document.querySelector('.dashboard');
  dashboard.style.height = '800px';
  firebase.database().ref(`connections/${usr().uid}/${device}/responses/`).on('child_added', (_snap) => {
    window.setTimeout(() => {
      firebase.database().ref(`connections/${usr().uid}/${device}/responses`).once('value', (snap) => {
        log.innerHTML = "";
        const keys = Object.keys(snap.val());
        for (let i = 0; i < keys.length; i++) {
          let response = snap.val()[keys[i]].replace(/>/g, '&gt;').replace(/</g, '&lt;').trim();
          if (!response) {
            response = '<span class="system">Empty</span>'
          }
          log.innerHTML += response + '<hr>';
          log.scrollBy(0, 99999);
          dashboard.scrollBy(0, 99999);
        }
      });
    }, 500);
  });
}

const consoleInput = document.querySelector('#console-input');
consoleInput.addEventListener('keyup' , (e) => {
  if (e.key === 'Enter') {

    const command = consoleInput.value;
    consoleInput.value = '';

    if (command === 'cls') {
      document.querySelector('#log').innerHTML = '<span class="system">Local and server log was cleared.</span><hr>'
      firebase.database().ref(`connections/${usr().uid}/${app.connectedDevice}/commands`).remove();
      firebase.database().ref(`connections/${usr().uid}/${app.connectedDevice}/responses`).remove();
      return
    }

    if (command === 'back') {
      app.panel = 'devices';
      app.connectedDevice = '';
      document.querySelector('.dashboard').style.height = '300px';

      return
    }

    const ref = firebase.database().ref(`connections/${usr().uid}/${app.connectedDevice}/commands/`).push();
    ref.set(command);
  }
});

const delay = ms => new Promise(res => setTimeout(res, ms));
