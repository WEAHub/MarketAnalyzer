const talib = require('talib');
const { getLast } = require('./funcs.js');

// Indicators
const calcIndicator = (name, series, period, values = {}) => {
  return {
    then : async (resolve, reject) => {
      const cfg = {
        inReal: values.inReal ? values.inReal : series,
        name: values.name ? values.name : name,
        startIdx: values.startIdx ? values.startIdx : 0,
        endIdx: values.endIdx > 0 ? values.endIdx : series.length - 1,
        optInTimePeriod: values.optInTimePeriod > 0 ? values.optInTimePeriod : period > 0 ? period : 14,
      };

      talib.execute(cfg, (err, result) => {
        if (err || (typeof result === 'undefined' || typeof result.result === 'undefined')) {
          reject(err.error);
        }
        else {
          resolve({
            series: result.result.outReal,
            current: getLast(result.result.outReal),
            last: getLast(result.result.outReal, 2)
          });
        }
      });
    }
  }
};

const checkCross = (src1, src2) => {

  const cross = (src1.current > src2.current && src1.last < src2.last)
    || (src1.current < src2.current && src1.last > src2.last);

  return {
    cross,
    up: src1.current > src2.current,
    down: src1.current < src2.current
  }
};

/*
const checkDivergences = (src, srcI) => {
  const findFractalTop = (src) => src[4] < src[2] && src[3] < src[2] && src[2] > src[1] && src[2] > src[0];
  const findFractalBot = (src) => src[4] > src[2] && src[3] > src[2] && src[2] < src[1] && src[2] < src[0];
  const fractalize = (src) => findFractalTop(srcI) ? 1 : findFractalBot(srcI) ? -1 : 0;
  const fractalTop = fractalize(src) > 0 ? src[2] : null;
  const fractalBot = fractalize(src) > 0 ? src[2] : null;
}
*/

const calcWT = async(series, chlen, avg, oversold, overbought) => {
  const ema = (x, y, p) => (x - p) * (2 / (y + 1)) + p;

  const ciStack = [];
  let ap = 0,
    esa = 0, prev_esa = 0,
    prev_d = 0, d = 0,
    wt = 0, prev_wt = 0,
    ci = 0;

  for(let i = 0; i < series.length; i++) {
    ap = series[i];
    esa = ema(ap, chlen, prev_esa);
    prev_esa = esa;
    d = ema(Math.abs(ap - esa), chlen, prev_d);
    prev_d = d;
    ci = d > 0.0 ? (ap - esa) / (0.015 * d) : 0;
    ciStack.push(ci);
    wt = ema(ci, avg, prev_wt);
    prev_wt = wt;
  }

  const wt1 = await calcIndicator('EMA', ciStack, avg);
  const wt2 = await calcIndicator('SMA', wt1.series, 3);

  const { cross, up, down } = checkCross(wt1, wt2);

  const buy = cross && up && wt2.current <=  oversold;
  const sell = cross && down && wt2.current >= overbought;

  return {
    wt1,
    wt2,
    cross,
    up,
    down,
    buy,
    sell
  }
};

const checkMA = async (ma, src, period) => {
  const ema = await calcIndicator(ma, src.series, period);

  const emaDist = src.current - ema.current;
  const {cross, up, down} = checkCross(src, ema);

  return {
    ema,
    emaDist,
    cross,
    up,
    down,
  };
};

const checkTrendSeries = (series, maxLookback = 10) => {
  const seriesLen = series.length;
  const current = series[seriesLen - 1];

  const result = {
    bull: true,
    bear: true,
    notrend: false
  };

  for (let i = seriesLen - maxLookback; i < seriesLen - 1; i++) {
    result.bull = result.bull && current > series[i];
  }

  for (let i = seriesLen - maxLookback; i < seriesLen - 1; i++) {
    result.bear = result.bear && current < series[i];
  }

  result.notrend = !(result.bull || result.bear);

  return result;
};

module.exports = {
  checkCross,
  calcIndicator,
  checkMA,
  checkTrendSeries,
  calcWT
}
