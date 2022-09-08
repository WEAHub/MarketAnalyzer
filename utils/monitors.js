const path = require('path');
const { sleep, equalObjects } = require('./funcs.js');
const fs = require('fs');

const _DEFAULT_DELAY = 150000;
const _DELAY_BETWEEN_MONITORS = 1000;

const _STRATEGIES = path.resolve('./strategies/');

class Monitors {
  constructor(fLoop) {
    this.activeMonitors = [];
    this.loop = fLoop;

    /** READ COMMANDS */
    process.openStdin().addListener("data", function(d) {
      const char = d.toString().trim();
      if (char === 'ra') {
        global.monitor.refreshAll();
      }
    });
  }

  stopMonitor(index) {
    clearInterval(this.activeMonitors[index].intRef);
    this.activeMonitors[index].running = false; // Last loop fix
  }

  async refreshAll() {
    for(let i = 0; i < this.activeMonitors.length; i++) {
      this.loop(this.activeMonitors[i]);
      await sleep(1000);
    }
  }

  cacheIndicator(indicator, index) {
    for (const ind of this.activeMonitors[index].indicators) {
      if (equalObjects(indicator, ind)) {
        return false;
      }
    }
    this.activeMonitors[index].indicators.push(indicator);
    return true;
  }

  loadStrategy(stratName, monitorIndex) {
    const stratPath = path.resolve(_STRATEGIES + '/' + stratName.toLowerCase() + '.js');
    if (fs.existsSync(stratPath)) {
      const strat = require(stratPath);
      return new strat(monitorIndex);
    }
    else {
      console.error(stratPath + ' strategy not found.').
      process.exit();
    }
  }

  async setMonitors(obj, cb) {
    for (const cfg of obj) {
      const monitorIndex = this.activeMonitors.length;

      this.activeMonitors[monitorIndex] = {
        monitorIndex,
        startedAt: new Date().getTime(),
        timeframe: cfg.timeframe !== '' ? cfg.timeframe : 'H',
        exchange: cfg.exchange !== '' ? cfg.exchange : 'COINBASE',
        fsym: cfg.fsym !== '' ? cfg.fsym : 'BTC',
        tsym: cfg.tsym !== '' ? cfg.tsym : 'USD',
        delay: cfg.delay >= 1000 ? cfg.delay : _DEFAULT_DELAY,
        coinpair: `${cfg.fsym}/${cfg.tsym}`,
        seriesStack: [],
        running: true,
        stacking: false,
        indicators: [],
      };

      this.activeMonitors[monitorIndex].strategies = cfg.strategies.map(v => ({
        name: v,
        init: this.loadStrategy(v, monitorIndex)
      }));

      const thisMonitor = this.activeMonitors[monitorIndex];
      this.loop(thisMonitor);
      thisMonitor.intRef = setInterval(() => this.loop(thisMonitor), thisMonitor.delay);
      await sleep(_DELAY_BETWEEN_MONITORS);
    }
    return this.activeMonitors;
  }
}

module.exports = Monitors;
