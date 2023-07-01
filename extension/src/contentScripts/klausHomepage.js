import { testFirestore } from '../backgroundScripts/firebaseFunctions.js';

const testFirestoreButton = document.getElementById('testFirestoreButton');

main()

function main() {
  testFirestoreButton.addEventListener('click', testFirestore);
}