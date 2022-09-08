const rp = require('request-promise');
const { getLast, sleep } = require('./funcs');
const lod = require('lodash');
// 26 R/s Monthly
const _APIKEY = '';
const _APIURL = 'https://min-api.cryptocompare.com/data/v2/{TF}?fsym={FSYM}&tsym={TSYM}&e={EXCH}&api_key={APIKEY}&aggregate={STEP}&limit=2000{TS}';
const _USERAGENT  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.116 Safari/537.36';

const _MIN_STACK = 250;
const _DELAY_STACK = 500;

const seriesStruct = {
  time: [],
  open: [],
  close: [],
  high: [],
  low: [],
  volumefrom: [],
  volumeto: [],
  hlc3 : []
};

const _TIMEFRAMES = {
  daily : ['1d', '2d', '7d', '30d'],
  hourly : ['1h', '2h', '4h', '8h'],
  minutes : ['1m', '3m', '5m', '15m', '30m']
};

const parseSeries = (series) => {
  const ret = series.reduce((ret, data) => ({
    time: [...ret.time, data.time],
    open: [...ret.open, data.open],
    close: [...ret.close, data.close],
    high: [...ret.high, data.high],
    low: [...ret.low, data.low],
    volumefrom: [...ret.volumefrom, data.volumefrom],
    volumeto: [...ret.volumeto, data.volumeto],
    hlc3: [...ret.hlc3, ((data.high + data.low + data.close) / 3)],
  }), seriesStruct);

  return {
    series: ret,
    current: getLast(ret.close),
    currentHLC3: getLast(ret.hlc3),
  }
};

const getSeries = (timeframe, exchange, fsym, tsym, stack) => {

  const sortSeries = (src1, src2) => lod.unionBy(src1, src2, "time")
    .sort((a, b) => a.time - b.time);

  const getApi = async (tf, exchange, fsym, tsym, step, toTs = '',) => {
    const url = _APIURL.replace('{FSYM}', fsym.toUpperCase())
      .replace('{TSYM}', tsym.toUpperCase())
      .replace('{EXCH}', exchange.toUpperCase())
      .replace('{TF}', tf)
      .replace('{STEP}', step)
      .replace('{APIKEY}', _APIKEY)
      .replace('{TS}', toTs ? '&toTs=' + toTs : '');

    return rp({
      uri: url,
      json: true,
      headers: {'User-Agent': _USERAGENT}
    });
  };

 return {
    then : async (resolve, reject) => {

      const step = timeframe.substr(0, timeframe.length - 1);
      const tf = _TIMEFRAMES.daily.includes(timeframe) ? 'histoday'
        : _TIMEFRAMES.hourly.includes(timeframe) ? 'histohour'
        : _TIMEFRAMES.minutes.includes(timeframe) ? 'histominute'
        : false;

      if (!tf) {
        console.log('ERROR: timeframe must be ', _TIMEFRAMES);
        reject(false);
      }

      try {
        let series;

        if (Object.keys(stack).length === 0) {
          let preStack = [];
          let backData = [];
          let lastTime = ~~(Date.now() / 1000);
          for (let i = 0; i < _MIN_STACK; i = preStack.length) {
            await sleep(_DELAY_STACK);
            backData = (await getApi(tf, exchange, fsym, tsym, step, lastTime))["Data"]["Data"];
            lastTime = backData[0].time;
            preStack = sortSeries(preStack, backData);
          }
          series = preStack;
        }
        else {
          const newStack =  (await getApi(tf, exchange, fsym, tsym, step))["Data"]["Data"];
          series = sortSeries(newStack, stack);
        }

        resolve(series);
      }
      catch(e) {
        reject(e.error)
      }

    }
  }
};

module.exports = {
  getSeries,
  parseSeries
};
