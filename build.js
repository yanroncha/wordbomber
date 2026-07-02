// Build a single self-contained HTML file for publishing (e.g. as a
// claude.ai Artifact). Inlines css/style.css and every js/*.js referenced
// from index.html. Usage: node build.js  ->  dist/wordbomber.html
var fs = require('fs');
var path = require('path');

var root = __dirname;
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (m, href) {
  var css = fs.readFileSync(path.join(root, href), 'utf8');
  return '<style>\n' + css + '</style>';
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, function (m, src) {
  var js = fs.readFileSync(path.join(root, src), 'utf8');
  return '<script>\n' + js + '</script>';
});

var outDir = path.join(root, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
var outFile = path.join(outDir, 'wordbomber.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log('Wrote ' + outFile + ' (' + html.length + ' bytes)');
