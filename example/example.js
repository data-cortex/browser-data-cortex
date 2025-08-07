const DataCortex = require('browser-data-cortex');

// make sure your build populates API_KEY somehow

DataCortex.init({ orgName: 'test', apiKey: process.env.API_KEY });
DataCortex.event({ kingdom: 'test_king' });
