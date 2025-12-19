/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_runner_workspace_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"/home/runner/workspace/src/app/api/auth/[...nextauth]/route.ts\",\n    nextConfigOutput,\n    userland: _home_runner_workspace_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJTJGc3JjJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZob21lJTJGcnVubmVyJTJGd29ya3NwYWNlJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNjO0FBQzNGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3NyYy9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3NyYy9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.ts":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _libs_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/libs/auth */ \"(rsc)/./src/libs/auth.ts\");\n// Third-party Imports\n\n// Lib Imports\n\n/*\n * As we do not have backend server, the refresh token feature has not been incorporated into the template.\n * Please refer https://next-auth.js.org/tutorials/refresh-token-rotation link for a reference.\n */ const handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(_libs_auth__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxzQkFBc0I7QUFDVTtBQUVoQyxjQUFjO0FBQzJCO0FBRXpDOzs7Q0FHQyxHQUVELE1BQU1FLFVBQVVGLGdEQUFRQSxDQUFDQyxtREFBV0E7QUFFTSIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhpcmQtcGFydHkgSW1wb3J0c1xuaW1wb3J0IE5leHRBdXRoIGZyb20gJ25leHQtYXV0aCdcblxuLy8gTGliIEltcG9ydHNcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSAnQC9saWJzL2F1dGgnXG5cbi8qXG4gKiBBcyB3ZSBkbyBub3QgaGF2ZSBiYWNrZW5kIHNlcnZlciwgdGhlIHJlZnJlc2ggdG9rZW4gZmVhdHVyZSBoYXMgbm90IGJlZW4gaW5jb3Jwb3JhdGVkIGludG8gdGhlIHRlbXBsYXRlLlxuICogUGxlYXNlIHJlZmVyIGh0dHBzOi8vbmV4dC1hdXRoLmpzLm9yZy90dXRvcmlhbHMvcmVmcmVzaC10b2tlbi1yb3RhdGlvbiBsaW5rIGZvciBhIHJlZmVyZW5jZS5cbiAqL1xuXG5jb25zdCBoYW5kbGVyID0gTmV4dEF1dGgoYXV0aE9wdGlvbnMpXG5cbmV4cG9ydCB7IGhhbmRsZXIgYXMgR0VULCBoYW5kbGVyIGFzIFBPU1QgfVxuIl0sIm5hbWVzIjpbIk5leHRBdXRoIiwiYXV0aE9wdGlvbnMiLCJoYW5kbGVyIiwiR0VUIiwiUE9TVCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/app/api/login/users.ts":
/*!************************************!*\
  !*** ./src/app/api/login/users.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   users: () => (/* binding */ users)\n/* harmony export */ });\n// ** Fake user data and data type\n// ** Please remove below user data and data type in production and verify user with Real Database\n// =============== Fake Data ============================\nconst users = [\n    {\n        id: 1,\n        name: 'Admin User',\n        password: 'admin',\n        email: 'admin@vuexy.com',\n        image: '/images/avatars/1.png',\n        tenantId: 'tenant-demo-001',\n        branchId: undefined,\n        roles: [\n            'admin',\n            'super_admin'\n        ],\n        permissions: [\n            '*'\n        ] // Wildcard = all permissions\n    },\n    {\n        id: 2,\n        name: 'Rajesh Kumar',\n        password: 'manager',\n        email: 'manager@incline.gym',\n        image: '/images/avatars/2.png',\n        tenantId: 'tenant-demo-001',\n        branchId: '576332a0-e48c-4931-933d-92dedd4e460f',\n        roles: [\n            'manager'\n        ],\n        permissions: [\n            'members.*',\n            'classes.*',\n            'attendance.*',\n            'referrals.*',\n            'dashboard.view',\n            'reports.*',\n            'leads.*',\n            'equipment.*',\n            'products.*',\n            'inventory.*',\n            'lockers.*',\n            'staff.view'\n        ]\n    },\n    {\n        id: 3,\n        name: 'Priya Sharma',\n        password: 'trainer',\n        email: 'trainer@incline.gym',\n        image: '/images/avatars/3.png',\n        tenantId: 'tenant-demo-001',\n        branchId: '576332a0-e48c-4931-933d-92dedd4e460f',\n        roles: [\n            'trainer'\n        ],\n        permissions: [\n            'members.view',\n            'classes.*',\n            'attendance.view',\n            'dashboard.view'\n        ]\n    },\n    {\n        id: 4,\n        name: 'Amit Patel',\n        password: 'member',\n        email: 'member@incline.gym',\n        image: '/images/avatars/4.png',\n        tenantId: 'tenant-demo-001',\n        branchId: '576332a0-e48c-4931-933d-92dedd4e460f',\n        roles: [\n            'member'\n        ],\n        permissions: [\n            'member-portal.*'\n        ]\n    }\n];\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9sb2dpbi91c2Vycy50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQUEsa0NBQWtDO0FBRWxDLGtHQUFrRztBQWFsRyx5REFBeUQ7QUFFbEQsTUFBTUEsUUFBcUI7SUFDaEM7UUFDRUMsSUFBSTtRQUNKQyxNQUFNO1FBQ05DLFVBQVU7UUFDVkMsT0FBTztRQUNQQyxPQUFPO1FBQ1BDLFVBQVU7UUFDVkMsVUFBVUM7UUFDVkMsT0FBTztZQUFDO1lBQVM7U0FBYztRQUMvQkMsYUFBYTtZQUFDO1NBQUksQ0FBQyw2QkFBNkI7SUFDbEQ7SUFDQTtRQUNFVCxJQUFJO1FBQ0pDLE1BQU07UUFDTkMsVUFBVTtRQUNWQyxPQUFPO1FBQ1BDLE9BQU87UUFDUEMsVUFBVTtRQUNWQyxVQUFVO1FBQ1ZFLE9BQU87WUFBQztTQUFVO1FBQ2xCQyxhQUFhO1lBQUM7WUFBYTtZQUFhO1lBQWdCO1lBQWU7WUFBa0I7WUFBYTtZQUFXO1lBQWU7WUFBYztZQUFlO1lBQWE7U0FBYTtJQUN6TDtJQUNBO1FBQ0VULElBQUk7UUFDSkMsTUFBTTtRQUNOQyxVQUFVO1FBQ1ZDLE9BQU87UUFDUEMsT0FBTztRQUNQQyxVQUFVO1FBQ1ZDLFVBQVU7UUFDVkUsT0FBTztZQUFDO1NBQVU7UUFDbEJDLGFBQWE7WUFBQztZQUFnQjtZQUFhO1lBQW1CO1NBQWlCO0lBQ2pGO0lBQ0E7UUFDRVQsSUFBSTtRQUNKQyxNQUFNO1FBQ05DLFVBQVU7UUFDVkMsT0FBTztRQUNQQyxPQUFPO1FBQ1BDLFVBQVU7UUFDVkMsVUFBVTtRQUNWRSxPQUFPO1lBQUM7U0FBUztRQUNqQkMsYUFBYTtZQUFDO1NBQWtCO0lBQ2xDO0NBQ0QiLCJzb3VyY2VzIjpbIi9ob21lL3J1bm5lci93b3Jrc3BhY2Uvc3JjL2FwcC9hcGkvbG9naW4vdXNlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gKiogRmFrZSB1c2VyIGRhdGEgYW5kIGRhdGEgdHlwZVxuXG4vLyAqKiBQbGVhc2UgcmVtb3ZlIGJlbG93IHVzZXIgZGF0YSBhbmQgZGF0YSB0eXBlIGluIHByb2R1Y3Rpb24gYW5kIHZlcmlmeSB1c2VyIHdpdGggUmVhbCBEYXRhYmFzZVxuZXhwb3J0IHR5cGUgVXNlclRhYmxlID0ge1xuICBpZDogbnVtYmVyXG4gIG5hbWU6IHN0cmluZ1xuICBlbWFpbDogc3RyaW5nXG4gIGltYWdlOiBzdHJpbmdcbiAgcGFzc3dvcmQ6IHN0cmluZ1xuICB0ZW5hbnRJZDogc3RyaW5nXG4gIGJyYW5jaElkPzogc3RyaW5nXG4gIHJvbGVzOiBzdHJpbmdbXVxuICBwZXJtaXNzaW9uczogc3RyaW5nW11cbn1cblxuLy8gPT09PT09PT09PT09PT09IEZha2UgRGF0YSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjb25zdCB1c2VyczogVXNlclRhYmxlW10gPSBbXG4gIHtcbiAgICBpZDogMSxcbiAgICBuYW1lOiAnQWRtaW4gVXNlcicsXG4gICAgcGFzc3dvcmQ6ICdhZG1pbicsXG4gICAgZW1haWw6ICdhZG1pbkB2dWV4eS5jb20nLFxuICAgIGltYWdlOiAnL2ltYWdlcy9hdmF0YXJzLzEucG5nJyxcbiAgICB0ZW5hbnRJZDogJ3RlbmFudC1kZW1vLTAwMScsXG4gICAgYnJhbmNoSWQ6IHVuZGVmaW5lZCwgLy8gVGVuYW50LWxldmVsIGFkbWluIC0gY2FuIHNlZSBhbGwgYnJhbmNoZXNcbiAgICByb2xlczogWydhZG1pbicsICdzdXBlcl9hZG1pbiddLFxuICAgIHBlcm1pc3Npb25zOiBbJyonXSAvLyBXaWxkY2FyZCA9IGFsbCBwZXJtaXNzaW9uc1xuICB9LFxuICB7XG4gICAgaWQ6IDIsXG4gICAgbmFtZTogJ1JhamVzaCBLdW1hcicsXG4gICAgcGFzc3dvcmQ6ICdtYW5hZ2VyJyxcbiAgICBlbWFpbDogJ21hbmFnZXJAaW5jbGluZS5neW0nLFxuICAgIGltYWdlOiAnL2ltYWdlcy9hdmF0YXJzLzIucG5nJyxcbiAgICB0ZW5hbnRJZDogJ3RlbmFudC1kZW1vLTAwMScsXG4gICAgYnJhbmNoSWQ6ICc1NzYzMzJhMC1lNDhjLTQ5MzEtOTMzZC05MmRlZGQ0ZTQ2MGYnLCAvLyBNYWluIEJyYW5jaFxuICAgIHJvbGVzOiBbJ21hbmFnZXInXSxcbiAgICBwZXJtaXNzaW9uczogWydtZW1iZXJzLionLCAnY2xhc3Nlcy4qJywgJ2F0dGVuZGFuY2UuKicsICdyZWZlcnJhbHMuKicsICdkYXNoYm9hcmQudmlldycsICdyZXBvcnRzLionLCAnbGVhZHMuKicsICdlcXVpcG1lbnQuKicsICdwcm9kdWN0cy4qJywgJ2ludmVudG9yeS4qJywgJ2xvY2tlcnMuKicsICdzdGFmZi52aWV3J11cbiAgfSxcbiAge1xuICAgIGlkOiAzLFxuICAgIG5hbWU6ICdQcml5YSBTaGFybWEnLFxuICAgIHBhc3N3b3JkOiAndHJhaW5lcicsXG4gICAgZW1haWw6ICd0cmFpbmVyQGluY2xpbmUuZ3ltJyxcbiAgICBpbWFnZTogJy9pbWFnZXMvYXZhdGFycy8zLnBuZycsXG4gICAgdGVuYW50SWQ6ICd0ZW5hbnQtZGVtby0wMDEnLFxuICAgIGJyYW5jaElkOiAnNTc2MzMyYTAtZTQ4Yy00OTMxLTkzM2QtOTJkZWRkNGU0NjBmJyxcbiAgICByb2xlczogWyd0cmFpbmVyJ10sXG4gICAgcGVybWlzc2lvbnM6IFsnbWVtYmVycy52aWV3JywgJ2NsYXNzZXMuKicsICdhdHRlbmRhbmNlLnZpZXcnLCAnZGFzaGJvYXJkLnZpZXcnXVxuICB9LFxuICB7XG4gICAgaWQ6IDQsXG4gICAgbmFtZTogJ0FtaXQgUGF0ZWwnLFxuICAgIHBhc3N3b3JkOiAnbWVtYmVyJyxcbiAgICBlbWFpbDogJ21lbWJlckBpbmNsaW5lLmd5bScsXG4gICAgaW1hZ2U6ICcvaW1hZ2VzL2F2YXRhcnMvNC5wbmcnLFxuICAgIHRlbmFudElkOiAndGVuYW50LWRlbW8tMDAxJyxcbiAgICBicmFuY2hJZDogJzU3NjMzMmEwLWU0OGMtNDkzMS05MzNkLTkyZGVkZDRlNDYwZicsXG4gICAgcm9sZXM6IFsnbWVtYmVyJ10sXG4gICAgcGVybWlzc2lvbnM6IFsnbWVtYmVyLXBvcnRhbC4qJ11cbiAgfVxuXVxuIl0sIm5hbWVzIjpbInVzZXJzIiwiaWQiLCJuYW1lIiwicGFzc3dvcmQiLCJlbWFpbCIsImltYWdlIiwidGVuYW50SWQiLCJicmFuY2hJZCIsInVuZGVmaW5lZCIsInJvbGVzIiwicGVybWlzc2lvbnMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/login/users.ts\n");

/***/ }),

/***/ "(rsc)/./src/libs/auth.ts":
/*!**************************!*\
  !*** ./src/libs/auth.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var _auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @auth/prisma-adapter */ \"(rsc)/./node_modules/@auth/prisma-adapter/index.js\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _app_api_login_users__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/app/api/login/users */ \"(rsc)/./src/app/api/login/users.ts\");\n// Third-party Imports\n\n\n\n\n// Local Imports\n\nconst prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_3__.PrismaClient();\nconst authOptions = {\n    adapter: (0,_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__.PrismaAdapter)(prisma),\n    secret: process.env.NEXTAUTH_SECRET,\n    // ** Configure one or more authentication providers\n    // ** Please refer to https://next-auth.js.org/configuration/options#providers for more `providers` options\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            // ** The name to display on the sign in form (e.g. 'Sign in with...')\n            // ** For more details on Credentials Provider, visit https://next-auth.js.org/providers/credentials\n            name: 'Credentials',\n            type: 'credentials',\n            /*\n       * As we are using our own Sign-in page, we do not need to change\n       * username or password attributes manually in following credentials object.\n       */ credentials: {},\n            async authorize (credentials) {\n                const { email, password } = credentials;\n                try {\n                    const user = _app_api_login_users__WEBPACK_IMPORTED_MODULE_4__.users.find((u)=>u.email === email && u.password === password);\n                    if (user) {\n                        const { password: _, ...filteredUserData } = user;\n                        return {\n                            ...filteredUserData,\n                            id: filteredUserData.id.toString()\n                        };\n                    } else {\n                        throw new Error(JSON.stringify({\n                            message: [\n                                'Email or Password is invalid'\n                            ]\n                        }));\n                    }\n                } catch (e) {\n                    throw new Error(e.message);\n                }\n            }\n        }),\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        })\n    ],\n    // ** Please refer to https://next-auth.js.org/configuration/options#session for more `session` options\n    session: {\n        /*\n     * Choose how you want to save the user session.\n     * The default is `jwt`, an encrypted JWT (JWE) stored in the session cookie.\n     * If you use an `adapter` however, NextAuth default it to `database` instead.\n     * You can still force a JWT session by explicitly defining `jwt`.\n     * When using `database`, the session cookie will only contain a `sessionToken` value,\n     * which is used to look up the session in the database.\n     * If you use a custom credentials provider, user accounts will not be persisted in a database by NextAuth.js (even if one is configured).\n     * The option to use JSON Web Tokens for session tokens must be enabled to use a custom credentials provider.\n     */ strategy: 'jwt',\n        // ** Seconds - How long until an idle session expires and is no longer valid\n        maxAge: 30 * 24 * 60 * 60 // ** 30 days\n    },\n    // ** Please refer to https://next-auth.js.org/configuration/options#pages for more `pages` options\n    pages: {\n        signIn: '/login'\n    },\n    // ** Please refer to https://next-auth.js.org/configuration/options#callbacks for more `callbacks` options\n    callbacks: {\n        /*\n     * While using `jwt` as a strategy, `jwt()` callback will be called before\n     * the `session()` callback. So we have to add custom parameters in `token`\n     * via `jwt()` callback to make them accessible in the `session()` callback\n     */ async jwt ({ token, user, account }) {\n            if (user) {\n                /*\n         * For adding custom parameters to user in session, we first need to add those parameters\n         * in token which then will be available in the `session()` callback\n         */ token.id = user.id;\n                token.name = user.name;\n                token.email = user.email;\n                // SECURITY: For OAuth providers, user data doesn't include tenantId/roles/permissions\n                // These must be provisioned in the database via User model after first login\n                // Until provisioned, OAuth users have NO access (empty arrays)\n                const isOAuthLogin = account?.provider && account.provider !== 'credentials';\n                if (isOAuthLogin) {\n                    // OAuth users: fetch from database User model (TODO: implement database lookup)\n                    // For now, OAuth users have no access until admin provisions them\n                    token.tenantId = user.tenantId || null;\n                    token.branchId = user.branchId || null;\n                    token.permissions = user.permissions || [];\n                    token.roles = user.roles || [];\n                } else {\n                    // Credentials login: use data from credentials provider\n                    token.tenantId = user.tenantId || 'tenant-demo-001' // Fallback for demo only\n                    ;\n                    token.branchId = user.branchId || null;\n                    token.permissions = user.permissions || [];\n                    token.roles = user.roles || [];\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                // ** Add custom params to user in session which are added in `jwt()` callback via `token` parameter\n                ;\n                session.user.id = token.id;\n                session.user.name = token.name;\n                session.user.email = token.email;\n                session.user.tenantId = token.tenantId;\n                session.user.branchId = token.branchId;\n                session.user.permissions = token.permissions;\n                session.user.roles = token.roles;\n            }\n            return session;\n        }\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGlicy9hdXRoLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxzQkFBc0I7QUFDMEM7QUFDVDtBQUNIO0FBQ1A7QUFJN0MsZ0JBQWdCO0FBQzZCO0FBRTdDLE1BQU1LLFNBQVMsSUFBSUYsd0RBQVlBO0FBRXhCLE1BQU1HLGNBQStCO0lBQzFDQyxTQUFTTCxtRUFBYUEsQ0FBQ0c7SUFFdkJHLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsZUFBZTtJQUVuQyxvREFBb0Q7SUFDcEQsMkdBQTJHO0lBQzNHQyxXQUFXO1FBQ1RaLDJFQUFrQkEsQ0FBQztZQUNqQixzRUFBc0U7WUFDdEUsb0dBQW9HO1lBQ3BHYSxNQUFNO1lBQ05DLE1BQU07WUFFTjs7O09BR0MsR0FDREMsYUFBYSxDQUFDO1lBQ2QsTUFBTUMsV0FBVUQsV0FBVztnQkFDekIsTUFBTSxFQUFFRSxLQUFLLEVBQUVDLFFBQVEsRUFBRSxHQUFHSDtnQkFFNUIsSUFBSTtvQkFDRixNQUFNSSxPQUFPZix1REFBS0EsQ0FBQ2dCLElBQUksQ0FBQ0MsQ0FBQUEsSUFBS0EsRUFBRUosS0FBSyxLQUFLQSxTQUFTSSxFQUFFSCxRQUFRLEtBQUtBO29CQUVqRSxJQUFJQyxNQUFNO3dCQUNSLE1BQU0sRUFBRUQsVUFBVUksQ0FBQyxFQUFFLEdBQUdDLGtCQUFrQixHQUFHSjt3QkFFN0MsT0FBTzs0QkFDTCxHQUFHSSxnQkFBZ0I7NEJBQ25CQyxJQUFJRCxpQkFBaUJDLEVBQUUsQ0FBQ0MsUUFBUTt3QkFDbEM7b0JBQ0YsT0FBTzt3QkFDTCxNQUFNLElBQUlDLE1BQ1JDLEtBQUtDLFNBQVMsQ0FBQzs0QkFDYkMsU0FBUztnQ0FBQzs2QkFBK0I7d0JBQzNDO29CQUVKO2dCQUNGLEVBQUUsT0FBT0MsR0FBUTtvQkFDZixNQUFNLElBQUlKLE1BQU1JLEVBQUVELE9BQU87Z0JBQzNCO1lBQ0Y7UUFDRjtRQUVBNUIsc0VBQWNBLENBQUM7WUFDYjhCLFVBQVV0QixRQUFRQyxHQUFHLENBQUNzQixnQkFBZ0I7WUFDdENDLGNBQWN4QixRQUFRQyxHQUFHLENBQUN3QixvQkFBb0I7UUFDaEQ7S0FHRDtJQUVELHVHQUF1RztJQUN2R0MsU0FBUztRQUNQOzs7Ozs7Ozs7S0FTQyxHQUNEQyxVQUFVO1FBRVYsNkVBQTZFO1FBQzdFQyxRQUFRLEtBQUssS0FBSyxLQUFLLEdBQUcsYUFBYTtJQUN6QztJQUVBLG1HQUFtRztJQUNuR0MsT0FBTztRQUNMQyxRQUFRO0lBQ1Y7SUFFQSwyR0FBMkc7SUFDM0dDLFdBQVc7UUFDVDs7OztLQUlDLEdBQ0QsTUFBTUMsS0FBSSxFQUFFQyxLQUFLLEVBQUV2QixJQUFJLEVBQUV3QixPQUFPLEVBQUU7WUFDaEMsSUFBSXhCLE1BQU07Z0JBQ1I7OztTQUdDLEdBQ0R1QixNQUFNbEIsRUFBRSxHQUFHTCxLQUFLSyxFQUFFO2dCQUNsQmtCLE1BQU03QixJQUFJLEdBQUdNLEtBQUtOLElBQUk7Z0JBQ3RCNkIsTUFBTXpCLEtBQUssR0FBR0UsS0FBS0YsS0FBSztnQkFFeEIsc0ZBQXNGO2dCQUN0Riw2RUFBNkU7Z0JBQzdFLCtEQUErRDtnQkFDL0QsTUFBTTJCLGVBQWVELFNBQVNFLFlBQVlGLFFBQVFFLFFBQVEsS0FBSztnQkFFL0QsSUFBSUQsY0FBYztvQkFDaEIsZ0ZBQWdGO29CQUNoRixrRUFBa0U7b0JBQ2xFRixNQUFNSSxRQUFRLEdBQUcsS0FBY0EsUUFBUSxJQUFJO29CQUMzQ0osTUFBTUssUUFBUSxHQUFHLEtBQWNBLFFBQVEsSUFBSTtvQkFDM0NMLE1BQU1NLFdBQVcsR0FBRyxLQUFjQSxXQUFXLElBQUksRUFBRTtvQkFDbkROLE1BQU1PLEtBQUssR0FBRyxLQUFjQSxLQUFLLElBQUksRUFBRTtnQkFDekMsT0FBTztvQkFDTCx3REFBd0Q7b0JBQ3hEUCxNQUFNSSxRQUFRLEdBQUcsS0FBY0EsUUFBUSxJQUFJLGtCQUFrQix5QkFBeUI7O29CQUN0RkosTUFBTUssUUFBUSxHQUFHLEtBQWNBLFFBQVEsSUFBSTtvQkFDM0NMLE1BQU1NLFdBQVcsR0FBRyxLQUFjQSxXQUFXLElBQUksRUFBRTtvQkFDbkROLE1BQU1PLEtBQUssR0FBRyxLQUFjQSxLQUFLLElBQUksRUFBRTtnQkFDekM7WUFDRjtZQUVBLE9BQU9QO1FBQ1Q7UUFDQSxNQUFNUCxTQUFRLEVBQUVBLE9BQU8sRUFBRU8sS0FBSyxFQUFFO1lBQzlCLElBQUlQLFFBQVFoQixJQUFJLEVBQUU7Z0JBQ2hCLG9HQUFvRzs7Z0JBQ2xHZ0IsUUFBUWhCLElBQUksQ0FBU0ssRUFBRSxHQUFHa0IsTUFBTWxCLEVBQUU7Z0JBQ3BDVyxRQUFRaEIsSUFBSSxDQUFDTixJQUFJLEdBQUc2QixNQUFNN0IsSUFBSTtnQkFDOUJzQixRQUFRaEIsSUFBSSxDQUFDRixLQUFLLEdBQUd5QixNQUFNekIsS0FBSztnQkFDL0JrQixRQUFRaEIsSUFBSSxDQUFTMkIsUUFBUSxHQUFHSixNQUFNSSxRQUFRO2dCQUM5Q1gsUUFBUWhCLElBQUksQ0FBUzRCLFFBQVEsR0FBR0wsTUFBTUssUUFBUTtnQkFDOUNaLFFBQVFoQixJQUFJLENBQVM2QixXQUFXLEdBQUdOLE1BQU1NLFdBQVc7Z0JBQ3BEYixRQUFRaEIsSUFBSSxDQUFTOEIsS0FBSyxHQUFHUCxNQUFNTyxLQUFLO1lBQzNDO1lBRUEsT0FBT2Q7UUFDVDtJQUNGO0FBQ0YsRUFBQyIsInNvdXJjZXMiOlsiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9zcmMvbGlicy9hdXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXJkLXBhcnR5IEltcG9ydHNcbmltcG9ydCBDcmVkZW50aWFsUHJvdmlkZXIgZnJvbSAnbmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFscydcbmltcG9ydCBHb29nbGVQcm92aWRlciBmcm9tICduZXh0LWF1dGgvcHJvdmlkZXJzL2dvb2dsZSdcbmltcG9ydCB7IFByaXNtYUFkYXB0ZXIgfSBmcm9tICdAYXV0aC9wcmlzbWEtYWRhcHRlcidcbmltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50J1xuaW1wb3J0IHR5cGUgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tICduZXh0LWF1dGgnXG5pbXBvcnQgdHlwZSB7IEFkYXB0ZXIgfSBmcm9tICduZXh0LWF1dGgvYWRhcHRlcnMnXG5cbi8vIExvY2FsIEltcG9ydHNcbmltcG9ydCB7IHVzZXJzIH0gZnJvbSAnQC9hcHAvYXBpL2xvZ2luL3VzZXJzJ1xuXG5jb25zdCBwcmlzbWEgPSBuZXcgUHJpc21hQ2xpZW50KClcblxuZXhwb3J0IGNvbnN0IGF1dGhPcHRpb25zOiBOZXh0QXV0aE9wdGlvbnMgPSB7XG4gIGFkYXB0ZXI6IFByaXNtYUFkYXB0ZXIocHJpc21hKSBhcyBBZGFwdGVyLFxuXG4gIHNlY3JldDogcHJvY2Vzcy5lbnYuTkVYVEFVVEhfU0VDUkVULFxuXG4gIC8vICoqIENvbmZpZ3VyZSBvbmUgb3IgbW9yZSBhdXRoZW50aWNhdGlvbiBwcm92aWRlcnNcbiAgLy8gKiogUGxlYXNlIHJlZmVyIHRvIGh0dHBzOi8vbmV4dC1hdXRoLmpzLm9yZy9jb25maWd1cmF0aW9uL29wdGlvbnMjcHJvdmlkZXJzIGZvciBtb3JlIGBwcm92aWRlcnNgIG9wdGlvbnNcbiAgcHJvdmlkZXJzOiBbXG4gICAgQ3JlZGVudGlhbFByb3ZpZGVyKHtcbiAgICAgIC8vICoqIFRoZSBuYW1lIHRvIGRpc3BsYXkgb24gdGhlIHNpZ24gaW4gZm9ybSAoZS5nLiAnU2lnbiBpbiB3aXRoLi4uJylcbiAgICAgIC8vICoqIEZvciBtb3JlIGRldGFpbHMgb24gQ3JlZGVudGlhbHMgUHJvdmlkZXIsIHZpc2l0IGh0dHBzOi8vbmV4dC1hdXRoLmpzLm9yZy9wcm92aWRlcnMvY3JlZGVudGlhbHNcbiAgICAgIG5hbWU6ICdDcmVkZW50aWFscycsXG4gICAgICB0eXBlOiAnY3JlZGVudGlhbHMnLFxuXG4gICAgICAvKlxuICAgICAgICogQXMgd2UgYXJlIHVzaW5nIG91ciBvd24gU2lnbi1pbiBwYWdlLCB3ZSBkbyBub3QgbmVlZCB0byBjaGFuZ2VcbiAgICAgICAqIHVzZXJuYW1lIG9yIHBhc3N3b3JkIGF0dHJpYnV0ZXMgbWFudWFsbHkgaW4gZm9sbG93aW5nIGNyZWRlbnRpYWxzIG9iamVjdC5cbiAgICAgICAqL1xuICAgICAgY3JlZGVudGlhbHM6IHt9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGNvbnN0IHsgZW1haWwsIHBhc3N3b3JkIH0gPSBjcmVkZW50aWFscyBhcyB7IGVtYWlsOiBzdHJpbmc7IHBhc3N3b3JkOiBzdHJpbmcgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdXNlciA9IHVzZXJzLmZpbmQodSA9PiB1LmVtYWlsID09PSBlbWFpbCAmJiB1LnBhc3N3b3JkID09PSBwYXNzd29yZClcblxuICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICBjb25zdCB7IHBhc3N3b3JkOiBfLCAuLi5maWx0ZXJlZFVzZXJEYXRhIH0gPSB1c2VyXG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIC4uLmZpbHRlcmVkVXNlckRhdGEsXG4gICAgICAgICAgICAgIGlkOiBmaWx0ZXJlZFVzZXJEYXRhLmlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogWydFbWFpbCBvciBQYXNzd29yZCBpcyBpbnZhbGlkJ11cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlLm1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSxcblxuICAgIEdvb2dsZVByb3ZpZGVyKHtcbiAgICAgIGNsaWVudElkOiBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEIGFzIHN0cmluZyxcbiAgICAgIGNsaWVudFNlY3JldDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9TRUNSRVQgYXMgc3RyaW5nXG4gICAgfSlcblxuICAgIC8vICoqIC4uLmFkZCBtb3JlIHByb3ZpZGVycyBoZXJlXG4gIF0sXG5cbiAgLy8gKiogUGxlYXNlIHJlZmVyIHRvIGh0dHBzOi8vbmV4dC1hdXRoLmpzLm9yZy9jb25maWd1cmF0aW9uL29wdGlvbnMjc2Vzc2lvbiBmb3IgbW9yZSBgc2Vzc2lvbmAgb3B0aW9uc1xuICBzZXNzaW9uOiB7XG4gICAgLypcbiAgICAgKiBDaG9vc2UgaG93IHlvdSB3YW50IHRvIHNhdmUgdGhlIHVzZXIgc2Vzc2lvbi5cbiAgICAgKiBUaGUgZGVmYXVsdCBpcyBgand0YCwgYW4gZW5jcnlwdGVkIEpXVCAoSldFKSBzdG9yZWQgaW4gdGhlIHNlc3Npb24gY29va2llLlxuICAgICAqIElmIHlvdSB1c2UgYW4gYGFkYXB0ZXJgIGhvd2V2ZXIsIE5leHRBdXRoIGRlZmF1bHQgaXQgdG8gYGRhdGFiYXNlYCBpbnN0ZWFkLlxuICAgICAqIFlvdSBjYW4gc3RpbGwgZm9yY2UgYSBKV1Qgc2Vzc2lvbiBieSBleHBsaWNpdGx5IGRlZmluaW5nIGBqd3RgLlxuICAgICAqIFdoZW4gdXNpbmcgYGRhdGFiYXNlYCwgdGhlIHNlc3Npb24gY29va2llIHdpbGwgb25seSBjb250YWluIGEgYHNlc3Npb25Ub2tlbmAgdmFsdWUsXG4gICAgICogd2hpY2ggaXMgdXNlZCB0byBsb29rIHVwIHRoZSBzZXNzaW9uIGluIHRoZSBkYXRhYmFzZS5cbiAgICAgKiBJZiB5b3UgdXNlIGEgY3VzdG9tIGNyZWRlbnRpYWxzIHByb3ZpZGVyLCB1c2VyIGFjY291bnRzIHdpbGwgbm90IGJlIHBlcnNpc3RlZCBpbiBhIGRhdGFiYXNlIGJ5IE5leHRBdXRoLmpzIChldmVuIGlmIG9uZSBpcyBjb25maWd1cmVkKS5cbiAgICAgKiBUaGUgb3B0aW9uIHRvIHVzZSBKU09OIFdlYiBUb2tlbnMgZm9yIHNlc3Npb24gdG9rZW5zIG11c3QgYmUgZW5hYmxlZCB0byB1c2UgYSBjdXN0b20gY3JlZGVudGlhbHMgcHJvdmlkZXIuXG4gICAgICovXG4gICAgc3RyYXRlZ3k6ICdqd3QnLFxuXG4gICAgLy8gKiogU2Vjb25kcyAtIEhvdyBsb25nIHVudGlsIGFuIGlkbGUgc2Vzc2lvbiBleHBpcmVzIGFuZCBpcyBubyBsb25nZXIgdmFsaWRcbiAgICBtYXhBZ2U6IDMwICogMjQgKiA2MCAqIDYwIC8vICoqIDMwIGRheXNcbiAgfSxcblxuICAvLyAqKiBQbGVhc2UgcmVmZXIgdG8gaHR0cHM6Ly9uZXh0LWF1dGguanMub3JnL2NvbmZpZ3VyYXRpb24vb3B0aW9ucyNwYWdlcyBmb3IgbW9yZSBgcGFnZXNgIG9wdGlvbnNcbiAgcGFnZXM6IHtcbiAgICBzaWduSW46ICcvbG9naW4nXG4gIH0sXG5cbiAgLy8gKiogUGxlYXNlIHJlZmVyIHRvIGh0dHBzOi8vbmV4dC1hdXRoLmpzLm9yZy9jb25maWd1cmF0aW9uL29wdGlvbnMjY2FsbGJhY2tzIGZvciBtb3JlIGBjYWxsYmFja3NgIG9wdGlvbnNcbiAgY2FsbGJhY2tzOiB7XG4gICAgLypcbiAgICAgKiBXaGlsZSB1c2luZyBgand0YCBhcyBhIHN0cmF0ZWd5LCBgand0KClgIGNhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIGJlZm9yZVxuICAgICAqIHRoZSBgc2Vzc2lvbigpYCBjYWxsYmFjay4gU28gd2UgaGF2ZSB0byBhZGQgY3VzdG9tIHBhcmFtZXRlcnMgaW4gYHRva2VuYFxuICAgICAqIHZpYSBgand0KClgIGNhbGxiYWNrIHRvIG1ha2UgdGhlbSBhY2Nlc3NpYmxlIGluIHRoZSBgc2Vzc2lvbigpYCBjYWxsYmFja1xuICAgICAqL1xuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyLCBhY2NvdW50IH0pIHtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAqIEZvciBhZGRpbmcgY3VzdG9tIHBhcmFtZXRlcnMgdG8gdXNlciBpbiBzZXNzaW9uLCB3ZSBmaXJzdCBuZWVkIHRvIGFkZCB0aG9zZSBwYXJhbWV0ZXJzXG4gICAgICAgICAqIGluIHRva2VuIHdoaWNoIHRoZW4gd2lsbCBiZSBhdmFpbGFibGUgaW4gdGhlIGBzZXNzaW9uKClgIGNhbGxiYWNrXG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbi5pZCA9IHVzZXIuaWRcbiAgICAgICAgdG9rZW4ubmFtZSA9IHVzZXIubmFtZVxuICAgICAgICB0b2tlbi5lbWFpbCA9IHVzZXIuZW1haWxcbiAgICAgICAgXG4gICAgICAgIC8vIFNFQ1VSSVRZOiBGb3IgT0F1dGggcHJvdmlkZXJzLCB1c2VyIGRhdGEgZG9lc24ndCBpbmNsdWRlIHRlbmFudElkL3JvbGVzL3Blcm1pc3Npb25zXG4gICAgICAgIC8vIFRoZXNlIG11c3QgYmUgcHJvdmlzaW9uZWQgaW4gdGhlIGRhdGFiYXNlIHZpYSBVc2VyIG1vZGVsIGFmdGVyIGZpcnN0IGxvZ2luXG4gICAgICAgIC8vIFVudGlsIHByb3Zpc2lvbmVkLCBPQXV0aCB1c2VycyBoYXZlIE5PIGFjY2VzcyAoZW1wdHkgYXJyYXlzKVxuICAgICAgICBjb25zdCBpc09BdXRoTG9naW4gPSBhY2NvdW50Py5wcm92aWRlciAmJiBhY2NvdW50LnByb3ZpZGVyICE9PSAnY3JlZGVudGlhbHMnXG4gICAgICAgIFxuICAgICAgICBpZiAoaXNPQXV0aExvZ2luKSB7XG4gICAgICAgICAgLy8gT0F1dGggdXNlcnM6IGZldGNoIGZyb20gZGF0YWJhc2UgVXNlciBtb2RlbCAoVE9ETzogaW1wbGVtZW50IGRhdGFiYXNlIGxvb2t1cClcbiAgICAgICAgICAvLyBGb3Igbm93LCBPQXV0aCB1c2VycyBoYXZlIG5vIGFjY2VzcyB1bnRpbCBhZG1pbiBwcm92aXNpb25zIHRoZW1cbiAgICAgICAgICB0b2tlbi50ZW5hbnRJZCA9ICh1c2VyIGFzIGFueSkudGVuYW50SWQgfHwgbnVsbFxuICAgICAgICAgIHRva2VuLmJyYW5jaElkID0gKHVzZXIgYXMgYW55KS5icmFuY2hJZCB8fCBudWxsXG4gICAgICAgICAgdG9rZW4ucGVybWlzc2lvbnMgPSAodXNlciBhcyBhbnkpLnBlcm1pc3Npb25zIHx8IFtdXG4gICAgICAgICAgdG9rZW4ucm9sZXMgPSAodXNlciBhcyBhbnkpLnJvbGVzIHx8IFtdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlZGVudGlhbHMgbG9naW46IHVzZSBkYXRhIGZyb20gY3JlZGVudGlhbHMgcHJvdmlkZXJcbiAgICAgICAgICB0b2tlbi50ZW5hbnRJZCA9ICh1c2VyIGFzIGFueSkudGVuYW50SWQgfHwgJ3RlbmFudC1kZW1vLTAwMScgLy8gRmFsbGJhY2sgZm9yIGRlbW8gb25seVxuICAgICAgICAgIHRva2VuLmJyYW5jaElkID0gKHVzZXIgYXMgYW55KS5icmFuY2hJZCB8fCBudWxsXG4gICAgICAgICAgdG9rZW4ucGVybWlzc2lvbnMgPSAodXNlciBhcyBhbnkpLnBlcm1pc3Npb25zIHx8IFtdXG4gICAgICAgICAgdG9rZW4ucm9sZXMgPSAodXNlciBhcyBhbnkpLnJvbGVzIHx8IFtdXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRva2VuXG4gICAgfSxcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xuICAgICAgICAvLyAqKiBBZGQgY3VzdG9tIHBhcmFtcyB0byB1c2VyIGluIHNlc3Npb24gd2hpY2ggYXJlIGFkZGVkIGluIGBqd3QoKWAgY2FsbGJhY2sgdmlhIGB0b2tlbmAgcGFyYW1ldGVyXG4gICAgICAgIDsoc2Vzc2lvbi51c2VyIGFzIGFueSkuaWQgPSB0b2tlbi5pZCBhcyBzdHJpbmdcbiAgICAgICAgc2Vzc2lvbi51c2VyLm5hbWUgPSB0b2tlbi5uYW1lIGFzIHN0cmluZ1xuICAgICAgICBzZXNzaW9uLnVzZXIuZW1haWwgPSB0b2tlbi5lbWFpbCBhcyBzdHJpbmc7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS50ZW5hbnRJZCA9IHRva2VuLnRlbmFudElkO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuYnJhbmNoSWQgPSB0b2tlbi5icmFuY2hJZDtcbiAgICAgICAgKHNlc3Npb24udXNlciBhcyBhbnkpLnBlcm1pc3Npb25zID0gdG9rZW4ucGVybWlzc2lvbnM7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5yb2xlcyA9IHRva2VuLnJvbGVzXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZXNzaW9uXG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOlsiQ3JlZGVudGlhbFByb3ZpZGVyIiwiR29vZ2xlUHJvdmlkZXIiLCJQcmlzbWFBZGFwdGVyIiwiUHJpc21hQ2xpZW50IiwidXNlcnMiLCJwcmlzbWEiLCJhdXRoT3B0aW9ucyIsImFkYXB0ZXIiLCJzZWNyZXQiLCJwcm9jZXNzIiwiZW52IiwiTkVYVEFVVEhfU0VDUkVUIiwicHJvdmlkZXJzIiwibmFtZSIsInR5cGUiLCJjcmVkZW50aWFscyIsImF1dGhvcml6ZSIsImVtYWlsIiwicGFzc3dvcmQiLCJ1c2VyIiwiZmluZCIsInUiLCJfIiwiZmlsdGVyZWRVc2VyRGF0YSIsImlkIiwidG9TdHJpbmciLCJFcnJvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJtZXNzYWdlIiwiZSIsImNsaWVudElkIiwiR09PR0xFX0NMSUVOVF9JRCIsImNsaWVudFNlY3JldCIsIkdPT0dMRV9DTElFTlRfU0VDUkVUIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwibWF4QWdlIiwicGFnZXMiLCJzaWduSW4iLCJjYWxsYmFja3MiLCJqd3QiLCJ0b2tlbiIsImFjY291bnQiLCJpc09BdXRoTG9naW4iLCJwcm92aWRlciIsInRlbmFudElkIiwiYnJhbmNoSWQiLCJwZXJtaXNzaW9ucyIsInJvbGVzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/libs/auth.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/openid-client","vendor-chunks/oauth","vendor-chunks/@babel","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/@auth","vendor-chunks/@panva","vendor-chunks/oidc-token-hash"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=%2Fhome%2Frunner%2Fworkspace%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Frunner%2Fworkspace&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();