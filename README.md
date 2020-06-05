# feathers-airtable
This module wraps airtable in feathers common API to make it callable by frameworks such as React Admin. 

**This is currently Alpha**.

## To Do
- Multi option
- Allow Airtable specific whitelist calls

![Demo of feathers airtable](./feathers-airtable-demo.gif)

```bash
$ npm install --save feathers-airtable
```

> __Important:__ `feathers-airtable` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).


## API

### `service(options)`

Returns a new service instance initialized with the given options.

```js
const service = require('feathers-airtable');

app.use('/my-table', service({
  apiKey: '123123213'
  baseId: '123123'
  tableName: 'Table 1'
}));
app.use('/my-table', service({ apiKey, baseId, tableName }));
```

__Options:__
- `apiKey` (**required**) - Airtable API Key 
- `tableName` (**required**) - Name of your table
- `baseId` (**required**) - `(e.g. appAbba123456)`

## Example

See the [clients](https://docs.feathersjs.com/api/client.html) chapter for more information about using Feathers in the browser and React Native.


## Server

```js
import feathers from '@feathersjs/feathers';
import airtable from 'feathers-airtable';

const app = feathers()
  .use('/my-table', airtable({
    apiKey: '123123213'
    baseId: '123123'
    tableName: 'Table 1' 
  }));

const myTable = app.service('my-table');

myTable.create({
  text: 'Message from React Native'
});
```

### Browser
I would strongly recommend not using this in the browser directly as Airtable API key grants full permissions!


### Developing
To develop you need to do the following 
1. copy the .env.sample file into .env and 
1. Create a test Base and Table and fill in the values to match
1. Run the test by doing ``` jest -i``` or ```jest --watch -i``` (i makes sure the tests are run sequentially) 
1. The tests should clean up the records in the DB but if you get odd failing tests do to stray records while developing you can simply delete the records in the table.
1. DON'T ever set to live data as it could be desctructive. 


## License

Copyright (c) 2020

Licensed under the [MIT license](LICENSE).