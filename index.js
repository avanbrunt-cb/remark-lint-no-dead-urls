'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const checkLinks = require('check-links');

function noDeadUrls(ast, file, options) {
  const urlToNodes = {};

  const aggregate = (node) => {
    const url = node.url;
    if (!url) return;
    if (
      options.skipLocalhost &&
      /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/.test(url)
    )
      return;

    if (options.ignoreURL.includes(url)) return;

    if (!urlToNodes[url]) {
      urlToNodes[url] = [];
    }

    urlToNodes[url].push(node);
  };

  visit(ast, ['link', 'image', 'definition'], aggregate);

  return checkLinks(Object.keys(urlToNodes), options.gotOptions).then(
    (results) => {
      Object.keys(results).forEach((url) => {
        const result = results[url];
        if (result.status !== 'dead') return;

        const nodes = urlToNodes[url];
        if (!nodes) return;

        for (const node of nodes) {
          file.message(`Link to ${url} is dead`, node);
        }
      });
    }
  );
}

function wrapper(ast, file, options) {
  options = options || {};
  // Remove online check
  return noDeadUrls(ast, file, options);
}

module.exports = rule('remark-lint:no-dead-urls', wrapper);
