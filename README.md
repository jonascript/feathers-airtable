# feathers-airtable

[![Build Status](https://travis-ci.org/jonascript/feathers-airtable.png?branch=master)](https://travis-ci.org/jonascript/feathers-airtable)
[![Code Climate](https://codeclimate.com/github/jonascript/feathers-airtable/badges/gpa.svg)](https://codeclimate.com/github/jonascript/feathers-airtable)
[![Test Coverage](https://codeclimate.com/github/jonascript/feathers-airtable/badges/coverage.svg)](https://codeclimate.com/github/jonascript/feathers-airtable/coverage)
[![Dependency Status](https://img.shields.io/david/jonascript/feathers-airtable.svg?style=flat-square)](https://david-dm.org/jonascript/feathers-airtable)
[![Download Status](https://img.shields.io/npm/dm/feathers-airtable.svg?style=flat-square)](https://www.npmjs.com/package/feathers-airtable)

> A wrapper for the feathers API

## Installation

```
npm install feathers-airtable --save
```

## Documentation

TBD

## Complete Example

Here's an example of a Feathers server that uses `feathers-airtable`. 

```js
const feathers = require('@feathersjs/feathers');
const plugin = require('feathers-airtable');

// Initialize the application
const app = feathers();

// Initialize the plugin
app.configure(plugin());
```

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
