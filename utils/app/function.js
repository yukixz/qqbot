"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.textsplit = textsplit;

function textsplit(text) {
  return text.split(/\s+/);
}