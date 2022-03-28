/**
 * This exercise has you implement a synchronize() method that will
 * copy all records from the sourceDb into the targetDb() then start
 * polling for changes. Places where you need to add code have been
 * mostly marked and the goal is to get the runTest() to complete
 * successfully.
 * 
 *
 * Requirements:
 *
 * Try to solve the following pieces for a production system. Note,
 * doing one well is better than doing all poorly. If you are unable to
 * complete certain requirements, please comment your approach to the 
 * solution.
 *
 * 1. syncAllNoLimit(): Make sure what is in the source database is 
 *    in our target database for all data in one sync. Think of a naive
 *    solution.
 * 2. syncAllSafely(): Make sure what is in the source database is in
 *    our target database for all data in batches during multiple
 *    syncs. Think of a pagination solution.
 * 3. syncNewChanges(): Make sure updates in the source database is in
 *    our target database without syncing all data for all time. Think
 *    of a delta changes solution.
 * 4. synchronize(): Create polling for the sync. A cadence where we
 *    check the source database for updates to sync.
 *
 * Feel free to use any libraries that you are comfortable with and
 * change the parameters and returns to solve for the requirements.
 *
 *
 * You will need to reference the following API documentation:
 * 
 * Required: https://www.npmjs.com/package/nedb
 * Required: https://github.com/bajankristof/nedb-promises
 * Recommended: https://lodash.com/docs/4.17.15
 * Recommended: https://www.npmjs.com/package/await-the#api-reference
 */

 const Datastore = require('nedb-promises');
 const _ = require('lodash');
 const the = require('await-the');
 const { faker } = require('@faker-js/faker');
 
 // The source database to sync updates from.
 const sourceDb = new Datastore({
     inMemoryOnly: true,
     timestampData: true
 });
 
 // The target database that sendEvents() will write too.
 const targetDb = new Datastore({
     inMemoryOnly: true,
     timestampData: true
 });
 
 let TOTAL_RECORDS;
 let EVENTS_SENT = 0;
 let idArray = []; // array to store ids to update
 let intervalID; // unique intervalID stored
 
 
 const load = async recordsToLoad => {
     // Add some documents to the collection.
     // TODO: Maybe dynamically do this? `faker` might be a good library here.
     if(typeof recordsToLoad != 'number')
     {
         recordsToLoad = 0;
     }
     // Loading 3 default documents that will be consistent to test
     await sourceDb.insert({ name : 'GE', owner: 'test', amount: 1000000 });
     console.log('Loaded GE');
     await the.wait(300);
     await sourceDb.insert({ name : 'Exxon', owner: 'test2', amount: 5000000 });
     console.log('Loaded Exxon');
     await the.wait(300);
     await sourceDb.insert({ name : 'Google', owner: 'test3', amount: 5000001 });
     console.log('Loaded Google');       
     TOTAL_RECORDS = 3;
     var i = 0;
     for(i = 0; i < recordsToLoad ; i++) // using faker to create dummy documents
     {
        await sourceDb.insert({ name : faker.company.companyName(), owner: 'test' + i, amount: faker.datatype.number() });
        TOTAL_RECORDS += 1;
     }
    return TOTAL_RECORDS;
 }
 
 /**
  *  Function to clear the sourceDB for testing purposes.
  */
 const clearSourceDB = async () => { 
     await sourceDb.remove({}, { multi: true});
 }
 
 /**
  * API to send each document to in order to sync.
  */
 const sendEvent = async data => {    
    // TODO: Write data to targetDb
    EVENTS_SENT = 0;
    console.log('Events being sent');
    data.forEach(async element => {
        EVENTS_SENT += 1;
        await targetDb.insert(element);  
    });   
    console.log('Completed insertion');
 };
 
 
 // Find and update an existing document.
 const touch = async nameVal => {
 const docs = await sourceDb.find({name: nameVal});   
    if(docs.length > 0)
    {
        await sourceDb.update({ name: nameVal }, { $set: { owner: 'test4' } });
        docs.forEach( doc => {
            idArray.push(doc["_id"]);
            EVENTS_SENT += 1;
        });
    }
    console.log(idArray);
    return idArray;
 };
 
 
 /**
  * Utility to log one record to the console for debugging.
  */
 const read = async name => {
     const record = await sourceDb.findOne( { name });
     console.log(record);
 };
 
 
 /**
  * Get all records out of the database and send them using
  * 'sendEvent()'.
  */
 const syncAllNoLimit = async () => {
     // TODO
    EVENTS_SENT = 0;
    console.log('Begin syncAllNoLimit');
    const result = await sourceDb.find({}).sort({});
    console.log('Retrieved all results from sourceDB');
    await sendEvent(result);
    return EVENTS_SENT;
 }
 
 
 /**
  * Sync up to the provided limit of records. Data returned from
  * this function will be provided on the next call as the data 
  * argument.
  */
 const syncWithLimit = async (limit, data) => {
     // TODO
    data.forEach(async doc => {
        EVENTS_SENT += 1;
        await targetDb.insert(doc);
    });    
 }
 
 
 /**
  * Synchronize in batches.
  */
 const syncAllSafely = async (batchSize) => {
     // FIXME: Example implementation.
     if(typeof batchSize != 'number' || batchSize < 0 || batchSize % 1 != 0)
     {
        batchSize = 1; // default batchsize to 1 if error is caught
     }
     const result = await sourceDb.find({}).sort({}); // get array of docs from sourceDB
     EVENTS_SENT = 0;
     console.log('begin batching');
     if (_.isNil(result)) {
         result = {}
     }
     const batches = _.chunk(result, batchSize); // using lodash to chuck the array into sub arrays
     batches.forEach(async batch => // sending each sub array as a batch to insert into targetDB
     {
        await syncWithLimit(batchSize, batch)
     });
     return EVENTS_SENT;
 }
 
 
 /**
  * Sync changes since the last time the function was called with
  * with the passed in data.
  */
 const syncNewChanges = async () => {
     // TODO
     EVENTS_SENT = 0;
     idArray.forEach(async id => { // loop for each id in the idArray
        EVENTS_SENT += 1;
        const sourceVal = await sourceDb.find({ _id : id }).sort({}); // get document associated with id from idArray
        await targetDb.update({ _id : id}, {$set : {...sourceVal[0]}});  // updating the tardb document whose _id matches id
        console.log('Updated ' + id);
    });   
     idArray = await []; // Clearing the idArray
     console.log('cleared idArray');
     return EVENTS_SENT;
 }
 
 
 /**
  * Implement function to fully sync of the database and then 
  * keep polling for changes.
  */
 const synchronize = async (interval, intervalID) => {
     // TODO
     if(typeof interval != 'number' || interval % 1 != 0 || interval < 1)
     {
         interval = 2000; // if arg value is a non-number or not a whole number or is smaller than 1 default to 2000ms
     }
     syncAllSafely(6); // sync targetDb with batches of size 6     
     if(!intervalID) // checking if an interval is already set up
     {
        intervalID = setInterval(() => syncNewChanges(), interval);
     }     
 }
 
 
 /**
  * Simple test construct to use while building up the functions
  * that will be needed for synchronize().
  */
//  const runTest = async () => {
//      await load(50);
 
//      // Check what the saved data looks like.
//      await read('GE');
     
//      EVENTS_SENT = 0;
//      await syncAllNoLimit();
//      // TODO: Maybe use something other than logs to validate use cases?
//      // Something like `assert` or `chai` might be good libraries here.
//      if (EVENTS_SENT === TOTAL_RECORDS) {
//          console.log('1. synchronized correct number of events')
//      }
//      targetDb.remove({}, {multi: true});
//      console.log(await sourceDb.find({}).sort({}));
//      EVENTS_SENT = 0;
//      const data = await syncAllSafely(7);
//      if (EVENTS_SENT === TOTAL_RECORDS) {
//          console.log('2. synchronized correct number of events')
//      }
     
//      // Make some updates and then sync just the changed files.
//      EVENTS_SENT = 0;
//      await the.wait(3000);
//      await touch('GE');
//      //await sourceDb.update({ name : 'GE', owner: 'test', amount: 1000000 }, { name : 'GE', owner: 'test', amount: 1000001 });
//      console.log(await sourceDb.find({}).sort({}));
//      await syncNewChanges(idArray);
//      //await sourceDb.insert({ name : 'Exxon', owner: 'test2', amount: 5000000 }); // if we insert after the initial load then syncNewChanges won't detect the new object
//      if (EVENTS_SENT === 1) {
//          console.log('3. synchronized correct number of events')
//      }

//      console.log('End of test');
//  }

 module.exports = {
    load: load,
    syncAllNoLimit: syncAllNoLimit,
    syncAllSafely: syncAllSafely,
    syncNewChanges: syncNewChanges,
    syncWithLimit : syncWithLimit,
    touch: touch,
    synchronize : synchronize,
    clearSourceDB : clearSourceDB
  };
 
 // TODO:
 // Call synchronize() instead of runTest() when you have synchronize working
 // or add it to runTest().
 // runTest();
 // synchronize(500);
 
 