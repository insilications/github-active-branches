// ==UserScript==
// @name        My GitHub Userscript
// @namespace   Violentmonkey Scripts
// @description Display active branches table at the top of GitHub repository pages and other features
// @author      process.env.AUTHOR
// @match       https://gist.github.com/*
// @match       https://github.com/*/*
// @exclude     https://github.com/*/*/branches/*
// @run-at      document-end
// @grant       GM_addStyle
// ==/UserScript==

/**
 * Code here will be ignored on compilation. So it's a good place to leave messages to developers.
 *
 * - The `@grant`s used in your source code will be added automatically by `rollup-plugin-userscript`.
 *   However you have to add explicitly those used in required resources.
 * - `process.env.AUTHOR` will be loaded from `package.json`.
 */
