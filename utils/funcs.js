const hash = require('object-hash');
const defaultLookbackByTime = (tf) => tf === 'D' ? 15 : tf === 'H' ? 10 : tf === 'M' ? 5 : 10;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getPercent = (oldValue, newValue) => (((oldValue - newValue) / oldValue) * 100);
const getLast = (arr, step = 1) => typeof(arr) !== "undefined" || arr.length > 0 ? arr[arr.length - step] : null;
const toInteger = (num) => (num * 1);
const equalObjects = (obj1, obj2) => hash(obj1) === hash(obj2);

module.exports = {
  defaultLookbackByTime,
  sleep,
  getLast,
  getPercent,
  toInteger,
  equalObjects
}
