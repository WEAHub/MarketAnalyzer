const colors = require('chalk');
const { calcIndicator } = require('./../utils/indicators.js');

const EMA_LEN = 50;

class Strategy {

  constructor(monitorIndex) {
    this.name = 'EMA Touch & Close';
    this.description = 'Checks if touch and close above or below EMA.';
    this.monitorIndex = monitorIndex;
    if(this.monitorIndex > -1) {
      monitor.cacheIndicator({
          name: 'EMA',
          settings: {
            length : EMA_LEN
          }
        },
        this.monitorIndex);
    }
  }

  async check(src) {

    const ret = {
      showAlert: false,
      alert: {},
      status: null
    };

    const revSrc = [].concat(src).reverse();

    let ema = await calcIndicator('SMA', src.series.close, EMA_LEN);

    // CROSS NOT CLOSED
    if (revSrc.current > ema.current) {
      const checkLow = (revSrc.series.close[1] <= ema.current)
        || (revSrc.series.low[1] <= ema.current)

    }

    // CROSS CLOSED
    if (revSrc.series.close[1] > ema.current) {
      const checkLow = (revSrc.series.close[2] <= ema.current)
        || (revSrc.series.low[2] <= ema.current)

    }

    /*
    wt.color = wt.up ? colors.green
      : wt.down ? colors.red
        : colors.white;

    ret.status = `WT: ${wt.color(wt.wt1.current.toFixed(2))} `;
    ret.status += `WT2: ${wt.color(wt.wt2.current.toFixed(2))}`;

    if (wt.buy || wt.sell) {
      ret.showAlert = true;
      ret.alert = {
        alertDir : { up: wt.buy, down: wt.sell },
        indicators: [
          {
            name: 'Fast wave',
            value: wt.wt1.current.toFixed(2).toString(),
          },
          {
            name: 'Slow wave',
            value: wt.wt2.current.toFixed(2).toString(),
          },
        ],
        message: `WT CROSS ${(wt.buy ? 'UP OVERSOLD' : wt.sell ? 'DOWN OVERBOUGHT' : '')}`
      }
    }
    */

    return ret;

  }
}

module.exports = Strategy;
