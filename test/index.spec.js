const assert = require('assert');
const the = require('await-the');
const { load, syncAllNoLimit, syncAllSafely, syncNewChanges, touch, synchronize, clearSourceDB} = require('../src/index');
let total = 0;
let intervalID;

describe('The load function', () => {
    it('Should load the sourceDB with 50 plus 3 default docs for size of 53 documents', async () => {
        await clearSourceDB();
        const result = await load(50);
        total = result;
        assert.equal(result, 53);
    });

    it('Should load the sourceDB with 26 plus 3 default docs since arg is not a whole num', async () => {
        await clearSourceDB();
        const result = await load(25.4);
        total = result;
        assert.equal(result, 29);
    });

    it('Should load the sourceDB with size 3 for default docs since arg is 0', async () => {
        await clearSourceDB();
        const result = await load(0);
        total = result;
        assert.equal(result, 3);
    });

    it('Should load the sourceDB with size 3 for default docs since arg is neg', async () => {
        await clearSourceDB();
        const result = await load(-1);
        total = result;
        assert.equal(result, 3);
    });

    it('Should load the sourceDB with size 3 for default docs since arg is a non-number', async () => {
        await clearSourceDB();
        const result = await load("one");
        total = result;
        assert.equal(result, 3);
    });
});

describe('The syncAllNoLimit function', () => {
    it('Should copy sourceDB to targetDB in one go', async () => {    
        await clearSourceDB();
        total = await load(50);    
        const events = await syncAllNoLimit();
        assert.equal(events, total);
    });
});

describe('The syncAllSafely function', () => {
    it('Should copy sourceDB to targetDB with batches size 7', async () => {
        await clearSourceDB();
        total = await load(50);  
        const events = await syncAllSafely(7);
        assert.equal(events, total);
    });

    it('Should set batch size to 1 since arg is a non-number', async () => {
        await clearSourceDB();
        total = await load(50);  
        const events = await syncAllSafely("five");
        assert.equal(events, total);
    });

    it('Should set batch size to 1 since arg is negative', async () => {
        await clearSourceDB();
        total = await load(50);  
        const events = await syncAllSafely(-4);
        assert.equal(events, total);
    });
});

describe('The syncNewChanges function', () => {
    it('Check for updates to sourceDB and update only those to the targetDB', async () => {
        await clearSourceDB();
        await load(50);  
        await the.wait(200);
        await touch('GE');
        await the.wait(200);
        await touch('Exxon');
        await the.wait(200);
        await touch('Google');
        const events = await syncNewChanges();
        assert.equal(events, 3);
    });   

    it('Check for 0 updates to sourceDB', async () => {
        await clearSourceDB();
        await load(50);  
        const events = await syncNewChanges();
        assert.equal(events, 0);
    });
});

// describe('The synchronize function', () => { 
//     it('Should check for updates every set interval', async () => {    
//         await clearSourceDB();
//         total = await load(50); 
//         await synchronize(500, intervalID);   
//         await the.wait(200);
//         await touch('GE');
//         await the.wait(200);
//         await touch('Exxon');
//         await the.wait(200);
//         const events = await touch('Google');        
//         assert.equal(events.length, 3);
//         await clearInterval(intervalID);
//     });
// });
