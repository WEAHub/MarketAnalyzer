const colors = require('chalk');
const { getLast } = require('./../utils/funcs.js');
const { calcWT } = require('./../utils/indicators.js');

const WT_OS = -60;
const WT_OB = 60;
const WT_CHANNEL_LENGTH = 9;
const WT_AVERAGE = 12;

const findDivs = true;

let divStack = [];

class Strategy {

  constructor(monitorIndex) {
    this.name = 'WaveTrend OB-OS';
    this.description = 'Alerts when WaveTrend is oversold or overbought.';
    this.monitorIndex = monitorIndex;
    this.thisMonitor = monitor.activeMonitors[this.monitorIndex];
    if(this.monitorIndex > -1) {
      monitor.cacheIndicator({
        name: 'weacipher',
        settings: {
          WT_CHANNEL_LENGTH,
          WT_AVERAGE
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

    let wt = await calcWT(src.series.hlc3, WT_CHANNEL_LENGTH, WT_AVERAGE, WT_OS, WT_OB);

   /**
    * REAL TIME DIVERGENCE
    */

   if (findDivs && (wt.buy || wt.sell)) {

      if (divStack.length > 0 && getLast(divStack).time < getLast(src.series.close).time) {

        let bullDiv;
        let bearDiv;

        for(const stack of divStack) {
          bullDiv = stack.src > src.current
            && stack.wt < wt.wt1.current;

          bearDiv = stack.src < src.current
            && stack.wt > wt.wt1.current;

          if (bullDiv) {
            console.log('BULLDIV', stack, wt)
          }
          else if(bearDiv) {
            console.log('BEARHDIV', stack, wt)
          }
        }

        if(divStack.length > 3 || bullDiv || bearDiv) divStack = [];
      }

      divStack.push({
        time: getLast(src.series.close).time,
        wt: wt.current,
        src: src.current
      });

    }

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

     return ret;

  }
}


module.exports = Strategy
