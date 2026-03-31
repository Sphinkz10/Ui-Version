const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const fs = require('fs');
const glob = require('glob');

// Use npx to run glob or glob-cli or just use simple node code to traverse
