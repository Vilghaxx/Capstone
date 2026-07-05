import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  projectId: 'capstone-280f0',
  databaseURL: 'https://capstone-280f0-default-rtdb.asia-southeast1.firebasedatabase.app'
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
