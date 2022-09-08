

const colors = require('chalk');
const { calcIndicator, checkCross } = require('./../utils/indicators.js');

class Strategy {

  constructor(monitorIndex) {
    this.name = 'GoldenCross';
    this.description = 'Alerts when MA 200 and MA 50 CROSS';
    this.monitorIndex = monitorIndex;
    if(this.monitorIndex > -1) {

      monitor.cacheIndicator({
          name: 'ma',
          settings: {
            length: 50,
            color: '#26c6da',
            lineWidth: 2
          }
        },
        this.monitorIndex);

      monitor.cacheIndicator({
          name: 'ma',
          settings: {
            length: 200,
            color: '#ff6d00',
            lineWidth: 3
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

    // MA 200
    const ma200 = await calcIndicator('SMA', src.series.close, 200);
    ma200.color = ma200.current < src.current ? colors.green
    : ma200.current > src.current ? colors.red
    : colors.white;
    ma200.status = ma200.current.toFixed(8);

    // MA 50
    const ma50 = await calcIndicator('SMA', src.series.close, 50);
    ma50.color = ma50.current < src.current ? colors.green
    : ma50.current > src.current ? colors.red
    : colors.white;
    ma50.status = ma50.current.toFixed(8);

    
    const rsi = await calcIndicator('RSI', src.series.close, 14);
    
    ret.status = `MA200: ${ma200.color(ma200.status)} `;
    ret.status += `MA50: ${ma50.color(ma50.status)} `;
    ret.status += `RSI: ${rsi.current}`;

    const masCross = checkCross(ma50.series, ma200.series);

    if (masCross.cross) {
      ret.showAlert = true;
      ret.alert = {
        alertDir: { up: masCross.up, down: masCross.down },
        indicators: [
          {
            name: 'MA 50',
            value: ma50.status,
          },
          {
            name: 'MA 200',
            value: ma200.status,
          },
       ],
        message: `MA'S CROSS ${(masCross.up ? 'UP' : masCross.down ? 'DOWN' : '')}`
      }
    }

    return ret;

  }
}

module.exports = Strategy;
