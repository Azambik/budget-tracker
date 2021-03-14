let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
  };

request.onsuccess = function(event) {
    db = event.target.result;
  
    // check if app is online, if yes run uploadbudget() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
      uploadbudget();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

  // This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget');
    budgetObjectStore.add(record);
  }

  function uploadbudget() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');
  
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget');
  
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_budget'], 'readwrite');
          // access the new_pizza object store
          const budgetObjectStore = transaction.objectStore('new_budget');
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved new transactions have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
  }

  // listen for app coming back online
window.addEventListener('online', uploadbudget);