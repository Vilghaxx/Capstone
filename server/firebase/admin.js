const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'capstone-280f0-firebase-adminsdk-fbsvc-85f2ede806.json'), 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://capstone-280f0-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

module.exports = {
  default: admin,
  db: admin.database()
};
