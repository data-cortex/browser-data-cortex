const DataCortex = require('browser-data-cortex');

// make sure your build populates API_KEY somehow

DataCortex.init({ org_name: 'test', api_key: process.env.API_KEY });
DataCortex.event({ kingdom: 'test_king' });
