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
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _rainbow_me_rainbowkit_styles_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @rainbow-me/rainbowkit/styles.css */ \"./node_modules/@rainbow-me/rainbowkit/dist/index.css\");\n/* harmony import */ var _rainbow_me_rainbowkit_styles_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_rainbow_me_rainbowkit_styles_css__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @rainbow-me/rainbowkit */ \"@rainbow-me/rainbowkit\");\n/* harmony import */ var wagmi__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! wagmi */ \"wagmi\");\n/* harmony import */ var wagmi_chains__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! wagmi/chains */ \"wagmi/chains\");\n/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! viem */ \"viem\");\n/* harmony import */ var viem__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(viem__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _tanstack_react_query__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @tanstack/react-query */ \"@tanstack/react-query\");\n/* harmony import */ var _tanstack_react_query__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_tanstack_react_query__WEBPACK_IMPORTED_MODULE_7__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__, wagmi__WEBPACK_IMPORTED_MODULE_4__, wagmi_chains__WEBPACK_IMPORTED_MODULE_5__]);\n([_rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__, wagmi__WEBPACK_IMPORTED_MODULE_4__, wagmi_chains__WEBPACK_IMPORTED_MODULE_5__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n// FIXED VERSION - Correct provider order and Wagmi v2 compatibility\n\n\n\n\n\n\n\n\n\n// Create QueryClient FIRST\nconst queryClient = new _tanstack_react_query__WEBPACK_IMPORTED_MODULE_7__.QueryClient({\n    defaultOptions: {\n        queries: {\n            staleTime: 1000 * 60 * 5,\n            gcTime: 1000 * 60 * 10,\n            retry: 3,\n            retryDelay: (attemptIndex)=>Math.min(1000 * 2 ** attemptIndex, 30000)\n        }\n    }\n});\n// Configure chains with Wagmi v2 syntax\nconst chains = [\n    wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.mainnet,\n    wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.sepolia,\n    wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.hardhat,\n    wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.localhost\n];\n// Create wagmi config\nconst config = (0,wagmi__WEBPACK_IMPORTED_MODULE_4__.createConfig)({\n    chains,\n    transports: {\n        [wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.mainnet.id]: (0,viem__WEBPACK_IMPORTED_MODULE_6__.http)( true ? `https://eth-mainnet.g.alchemy.com/v2/${\"7geLbhaVQ3ga3021TPJrRFHnmOGa3-RS\"}` : 0),\n        [wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.sepolia.id]: (0,viem__WEBPACK_IMPORTED_MODULE_6__.http)( true ? `https://eth-sepolia.g.alchemy.com/v2/${\"7geLbhaVQ3ga3021TPJrRFHnmOGa3-RS\"}` : 0),\n        [wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.hardhat.id]: (0,viem__WEBPACK_IMPORTED_MODULE_6__.http)(\"http://127.0.0.1:8545\"),\n        [wagmi_chains__WEBPACK_IMPORTED_MODULE_5__.localhost.id]: (0,viem__WEBPACK_IMPORTED_MODULE_6__.http)(\"http://127.0.0.1:8545\")\n    },\n    ssr: true\n});\n// Configure wallet connectors with correct chains reference\nconst { connectors } = (0,_rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__.getDefaultWallets)({\n    appName: \"DAO MultiSig Wallet\",\n    projectId: \"5f034e7c1dd6bdb5643f82af70ee4f02\" || 0,\n    chains\n});\nfunction MyApp({ Component, pageProps }) {\n    return(// CORRECT ORDER: QueryClientProvider MUST be the outermost provider\n    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_tanstack_react_query__WEBPACK_IMPORTED_MODULE_7__.QueryClientProvider, {\n        client: queryClient,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(wagmi__WEBPACK_IMPORTED_MODULE_4__.WagmiProvider, {\n            config: config,\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__.RainbowKitProvider, {\n                chains: chains,\n                theme: (0,_rainbow_me_rainbowkit__WEBPACK_IMPORTED_MODULE_3__.darkTheme)({\n                    accentColor: \"#7b3ff2\",\n                    accentColorForeground: \"white\",\n                    borderRadius: \"medium\",\n                    fontStack: \"system\",\n                    overlayBlur: \"small\"\n                }),\n                appInfo: {\n                    appName: \"DAO MultiSig Wallet\",\n                    learnMoreUrl: \"https://github.com/your-username/dao-multisig-wallet\"\n                },\n                showRecentTransactions: true,\n                modalSize: \"compact\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\khoer\\\\dao-multisig-wallet\\\\frontend\\\\pages\\\\_app.js\",\n                    lineNumber: 76,\n                    columnNumber: 11\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\khoer\\\\dao-multisig-wallet\\\\frontend\\\\pages\\\\_app.js\",\n                lineNumber: 60,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"C:\\\\Users\\\\khoer\\\\dao-multisig-wallet\\\\frontend\\\\pages\\\\_app.js\",\n            lineNumber: 59,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\khoer\\\\dao-multisig-wallet\\\\frontend\\\\pages\\\\_app.js\",\n        lineNumber: 58,\n        columnNumber: 5\n    }, this));\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0VBQW9FOztBQUN0QztBQUNZO0FBS1g7QUFDTTtBQUM4QjtBQUN4QztBQUNTO0FBQ29DO0FBRXhFLDJCQUEyQjtBQUMzQixNQUFNWSxjQUFjLElBQUlGLDhEQUFXQSxDQUFDO0lBQ2xDRyxnQkFBZ0I7UUFDZEMsU0FBUztZQUNQQyxXQUFXLE9BQU8sS0FBSztZQUN2QkMsUUFBUSxPQUFPLEtBQUs7WUFDcEJDLE9BQU87WUFDUEMsWUFBWUMsQ0FBQUEsZUFBZ0JDLEtBQUtDLEdBQUcsQ0FBQyxPQUFPLEtBQUtGLGNBQWM7UUFDakU7SUFDRjtBQUNGO0FBRUEsd0NBQXdDO0FBQ3hDLE1BQU1HLFNBQVM7SUFBQ2xCLGlEQUFPQTtJQUFFQyxpREFBT0E7SUFBRUMsaURBQU9BO0lBQUVDLG1EQUFTQTtDQUFDO0FBRXJELHNCQUFzQjtBQUN0QixNQUFNZ0IsU0FBU2QsbURBQVlBLENBQUM7SUFDMUJhO0lBQ0FFLFlBQVk7UUFDVixDQUFDcEIsaURBQU9BLENBQUNxQixFQUFFLENBQUMsRUFBRWpCLDBDQUFJQSxDQUFDa0IsS0FBdUMsR0FDdEQsQ0FBQyxxQ0FBcUMsRUFBRUEsa0NBQXVDLENBQUMsQ0FBQyxHQUNqRkcsQ0FBU0E7UUFFYixDQUFDeEIsaURBQU9BLENBQUNvQixFQUFFLENBQUMsRUFBRWpCLDBDQUFJQSxDQUFDa0IsS0FBdUMsR0FDdEQsQ0FBQyxxQ0FBcUMsRUFBRUEsa0NBQXVDLENBQUMsQ0FBQyxHQUNqRkcsQ0FBU0E7UUFFYixDQUFDdkIsaURBQU9BLENBQUNtQixFQUFFLENBQUMsRUFBRWpCLDBDQUFJQSxDQUFDO1FBQ25CLENBQUNELG1EQUFTQSxDQUFDa0IsRUFBRSxDQUFDLEVBQUVqQiwwQ0FBSUEsQ0FBQztJQUN2QjtJQUNBc0IsS0FBSztBQUNQO0FBRUEsNERBQTREO0FBQzVELE1BQU0sRUFBRUMsVUFBVSxFQUFFLEdBQUcvQix5RUFBaUJBLENBQUM7SUFDdkNnQyxTQUFTO0lBQ1RDLFdBQVdQLGtDQUFpRCxJQUFJO0lBQ2hFSjtBQUNGO0FBRUEsU0FBU2EsTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNyQyxPQUNFLG9FQUFvRTtrQkFDcEUsOERBQUMxQixzRUFBbUJBO1FBQUMyQixRQUFRMUI7a0JBQzNCLDRFQUFDVCxnREFBYUE7WUFBQ29CLFFBQVFBO3NCQUNyQiw0RUFBQ3RCLHNFQUFrQkE7Z0JBQ2pCcUIsUUFBUUE7Z0JBQ1JpQixPQUFPckMsaUVBQVNBLENBQUM7b0JBQ2ZzQyxhQUFhO29CQUNiQyx1QkFBdUI7b0JBQ3ZCQyxjQUFjO29CQUNkQyxXQUFXO29CQUNYQyxhQUFhO2dCQUNmO2dCQUNBQyxTQUFTO29CQUNQYixTQUFTO29CQUNUYyxjQUFjO2dCQUNoQjtnQkFDQUMsd0JBQXdCO2dCQUN4QkMsV0FBVTswQkFFViw0RUFBQ1o7b0JBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS2xDO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kYW8tbXVsdGlzaWctZnJvbnRlbmQvLi9wYWdlcy9fYXBwLmpzP2UwYWQiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gRklYRUQgVkVSU0lPTiAtIENvcnJlY3QgcHJvdmlkZXIgb3JkZXIgYW5kIFdhZ21pIHYyIGNvbXBhdGliaWxpdHlcclxuaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnXHJcbmltcG9ydCAnQHJhaW5ib3ctbWUvcmFpbmJvd2tpdC9zdHlsZXMuY3NzJ1xyXG5pbXBvcnQge1xyXG4gIGdldERlZmF1bHRXYWxsZXRzLFxyXG4gIFJhaW5ib3dLaXRQcm92aWRlcixcclxuICBkYXJrVGhlbWUsXHJcbn0gZnJvbSAnQHJhaW5ib3ctbWUvcmFpbmJvd2tpdCdcclxuaW1wb3J0IHsgV2FnbWlQcm92aWRlciB9IGZyb20gJ3dhZ21pJ1xyXG5pbXBvcnQgeyBtYWlubmV0LCBzZXBvbGlhLCBoYXJkaGF0LCBsb2NhbGhvc3QgfSBmcm9tICd3YWdtaS9jaGFpbnMnXHJcbmltcG9ydCB7IGh0dHAgfSBmcm9tICd2aWVtJ1xyXG5pbXBvcnQgeyBjcmVhdGVDb25maWcgfSBmcm9tICd3YWdtaSdcclxuaW1wb3J0IHsgUXVlcnlDbGllbnQsIFF1ZXJ5Q2xpZW50UHJvdmlkZXIgfSBmcm9tICdAdGFuc3RhY2svcmVhY3QtcXVlcnknXHJcblxyXG4vLyBDcmVhdGUgUXVlcnlDbGllbnQgRklSU1RcclxuY29uc3QgcXVlcnlDbGllbnQgPSBuZXcgUXVlcnlDbGllbnQoe1xyXG4gIGRlZmF1bHRPcHRpb25zOiB7XHJcbiAgICBxdWVyaWVzOiB7XHJcbiAgICAgIHN0YWxlVGltZTogMTAwMCAqIDYwICogNSwgLy8gNSBtaW51dGVzXHJcbiAgICAgIGdjVGltZTogMTAwMCAqIDYwICogMTAsIC8vIDEwIG1pbnV0ZXMgKHJlbmFtZWQgZnJvbSBjYWNoZVRpbWUpXHJcbiAgICAgIHJldHJ5OiAzLFxyXG4gICAgICByZXRyeURlbGF5OiBhdHRlbXB0SW5kZXggPT4gTWF0aC5taW4oMTAwMCAqIDIgKiogYXR0ZW1wdEluZGV4LCAzMDAwMCksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcblxyXG4vLyBDb25maWd1cmUgY2hhaW5zIHdpdGggV2FnbWkgdjIgc3ludGF4XHJcbmNvbnN0IGNoYWlucyA9IFttYWlubmV0LCBzZXBvbGlhLCBoYXJkaGF0LCBsb2NhbGhvc3RdXHJcblxyXG4vLyBDcmVhdGUgd2FnbWkgY29uZmlnXHJcbmNvbnN0IGNvbmZpZyA9IGNyZWF0ZUNvbmZpZyh7XHJcbiAgY2hhaW5zLFxyXG4gIHRyYW5zcG9ydHM6IHtcclxuICAgIFttYWlubmV0LmlkXTogaHR0cChwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19BTENIRU1ZX0FQSV9LRVkgXHJcbiAgICAgID8gYGh0dHBzOi8vZXRoLW1haW5uZXQuZy5hbGNoZW15LmNvbS92Mi8ke3Byb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0FMQ0hFTVlfQVBJX0tFWX1gXHJcbiAgICAgIDogdW5kZWZpbmVkXHJcbiAgICApLFxyXG4gICAgW3NlcG9saWEuaWRdOiBodHRwKHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0FMQ0hFTVlfQVBJX0tFWVxyXG4gICAgICA/IGBodHRwczovL2V0aC1zZXBvbGlhLmcuYWxjaGVteS5jb20vdjIvJHtwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19BTENIRU1ZX0FQSV9LRVl9YFxyXG4gICAgICA6IHVuZGVmaW5lZFxyXG4gICAgKSxcclxuICAgIFtoYXJkaGF0LmlkXTogaHR0cCgnaHR0cDovLzEyNy4wLjAuMTo4NTQ1JyksXHJcbiAgICBbbG9jYWxob3N0LmlkXTogaHR0cCgnaHR0cDovLzEyNy4wLjAuMTo4NTQ1JyksXHJcbiAgfSxcclxuICBzc3I6IHRydWUsIC8vIEVuYWJsZSBTU1Igc3VwcG9ydFxyXG59KVxyXG5cclxuLy8gQ29uZmlndXJlIHdhbGxldCBjb25uZWN0b3JzIHdpdGggY29ycmVjdCBjaGFpbnMgcmVmZXJlbmNlXHJcbmNvbnN0IHsgY29ubmVjdG9ycyB9ID0gZ2V0RGVmYXVsdFdhbGxldHMoe1xyXG4gIGFwcE5hbWU6ICdEQU8gTXVsdGlTaWcgV2FsbGV0JyxcclxuICBwcm9qZWN0SWQ6IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1dBTExFVF9DT05ORUNUX1BST0pFQ1RfSUQgfHwgJ2RlbW8nLFxyXG4gIGNoYWlucywgLy8gVXNlIHRoZSBjaGFpbnMgYXJyYXkgZGlyZWN0bHlcclxufSlcclxuXHJcbmZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xyXG4gIHJldHVybiAoXHJcbiAgICAvLyBDT1JSRUNUIE9SREVSOiBRdWVyeUNsaWVudFByb3ZpZGVyIE1VU1QgYmUgdGhlIG91dGVybW9zdCBwcm92aWRlclxyXG4gICAgPFF1ZXJ5Q2xpZW50UHJvdmlkZXIgY2xpZW50PXtxdWVyeUNsaWVudH0+XHJcbiAgICAgIDxXYWdtaVByb3ZpZGVyIGNvbmZpZz17Y29uZmlnfT5cclxuICAgICAgICA8UmFpbmJvd0tpdFByb3ZpZGVyXHJcbiAgICAgICAgICBjaGFpbnM9e2NoYWluc31cclxuICAgICAgICAgIHRoZW1lPXtkYXJrVGhlbWUoe1xyXG4gICAgICAgICAgICBhY2NlbnRDb2xvcjogJyM3YjNmZjInLFxyXG4gICAgICAgICAgICBhY2NlbnRDb2xvckZvcmVncm91bmQ6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogJ21lZGl1bScsXHJcbiAgICAgICAgICAgIGZvbnRTdGFjazogJ3N5c3RlbScsXHJcbiAgICAgICAgICAgIG92ZXJsYXlCbHVyOiAnc21hbGwnLFxyXG4gICAgICAgICAgfSl9XHJcbiAgICAgICAgICBhcHBJbmZvPXt7XHJcbiAgICAgICAgICAgIGFwcE5hbWU6ICdEQU8gTXVsdGlTaWcgV2FsbGV0JyxcclxuICAgICAgICAgICAgbGVhcm5Nb3JlVXJsOiAnaHR0cHM6Ly9naXRodWIuY29tL3lvdXItdXNlcm5hbWUvZGFvLW11bHRpc2lnLXdhbGxldCcsXHJcbiAgICAgICAgICB9fVxyXG4gICAgICAgICAgc2hvd1JlY2VudFRyYW5zYWN0aW9ucz17dHJ1ZX1cclxuICAgICAgICAgIG1vZGFsU2l6ZT1cImNvbXBhY3RcIlxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cclxuICAgICAgICA8L1JhaW5ib3dLaXRQcm92aWRlcj5cclxuICAgICAgPC9XYWdtaVByb3ZpZGVyPlxyXG4gICAgPC9RdWVyeUNsaWVudFByb3ZpZGVyPlxyXG4gIClcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgTXlBcHAiXSwibmFtZXMiOlsiZ2V0RGVmYXVsdFdhbGxldHMiLCJSYWluYm93S2l0UHJvdmlkZXIiLCJkYXJrVGhlbWUiLCJXYWdtaVByb3ZpZGVyIiwibWFpbm5ldCIsInNlcG9saWEiLCJoYXJkaGF0IiwibG9jYWxob3N0IiwiaHR0cCIsImNyZWF0ZUNvbmZpZyIsIlF1ZXJ5Q2xpZW50IiwiUXVlcnlDbGllbnRQcm92aWRlciIsInF1ZXJ5Q2xpZW50IiwiZGVmYXVsdE9wdGlvbnMiLCJxdWVyaWVzIiwic3RhbGVUaW1lIiwiZ2NUaW1lIiwicmV0cnkiLCJyZXRyeURlbGF5IiwiYXR0ZW1wdEluZGV4IiwiTWF0aCIsIm1pbiIsImNoYWlucyIsImNvbmZpZyIsInRyYW5zcG9ydHMiLCJpZCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19BTENIRU1ZX0FQSV9LRVkiLCJ1bmRlZmluZWQiLCJzc3IiLCJjb25uZWN0b3JzIiwiYXBwTmFtZSIsInByb2plY3RJZCIsIk5FWFRfUFVCTElDX1dBTExFVF9DT05ORUNUX1BST0pFQ1RfSUQiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImNsaWVudCIsInRoZW1lIiwiYWNjZW50Q29sb3IiLCJhY2NlbnRDb2xvckZvcmVncm91bmQiLCJib3JkZXJSYWRpdXMiLCJmb250U3RhY2siLCJvdmVybGF5Qmx1ciIsImFwcEluZm8iLCJsZWFybk1vcmVVcmwiLCJzaG93UmVjZW50VHJhbnNhY3Rpb25zIiwibW9kYWxTaXplIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "@tanstack/react-query":
/*!****************************************!*\
  !*** external "@tanstack/react-query" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@tanstack/react-query");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "viem":
/*!***********************!*\
  !*** external "viem" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("viem");

/***/ }),

/***/ "@rainbow-me/rainbowkit":
/*!*****************************************!*\
  !*** external "@rainbow-me/rainbowkit" ***!
  \*****************************************/
/***/ ((module) => {

"use strict";
module.exports = import("@rainbow-me/rainbowkit");;

/***/ }),

/***/ "wagmi":
/*!************************!*\
  !*** external "wagmi" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("wagmi");;

/***/ }),

/***/ "wagmi/chains":
/*!*******************************!*\
  !*** external "wagmi/chains" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = import("wagmi/chains");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@rainbow-me"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();