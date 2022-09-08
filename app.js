const colors = require('chalk');
const ms = require('ms');
const { getSeries, parseSeries } = require('./utils/api.js');
const discord = require('./utils/discord.js');
const monitors = require('./utils/monitors.js');
const liveTable = require('./utils/livetable.js');

global.monitor = new monitors();
//global.discordBot = new discord();
global.table = new liveTable();

const loopMonitor = async(cfg) => {
  // THIS MONITOR
  const thisMonitor = global.monitor.activeMonitors[cfg.monitorIndex];
  if (!thisMonitor.running || thisMonitor.stacking) return;
  const ts = new Date().toLocaleTimeString();

  // STACK SERIES
  thisMonitor.stacking = true;
  let src = await getSeries(cfg.timeframe, cfg.exchange, cfg.fsym, cfg.tsym, thisMonitor.seriesStack);
  thisMonitor.seriesStack = src;
  src = parseSeries(src);
  thisMonitor.stacking = false;

  // TEST STRATS
  const stratStatus = [];
  for(let strat of cfg.strategies) {
    const stratRet = await strat.init.check(src);
    stratStatus.push(stratRet.status);

    // DISCORD ALERT
    if (stratRet.showAlert) {
      /*
      await discordBot.sendAlert({
        ...cfg,
        ...stratRet.alert,
        currentStackIndex: thisMonitor.seriesStack.length - 1,
        currentPrice: src.current,
      })
      */
    }

  }

  // LIVE TABLE
  table.rows[cfg.monitorIndex] = [
    ts,
    cfg.exchange,
    cfg.coinpair,
    colors.magenta(cfg.timeframe),
    colors.yellow(src.current),
    cfg.strategies.map(v => v.name).join(' | '),
    stratStatus.join(' | '),
    colors.gray(ms(cfg.delay, { long: true }))
  ];

  table.update();
};



(async () => {

  const strats = [
    'waveOBOS',
    'goldenCross'
  ];

  monitor.loop = loopMonitor;

  await monitor.setMonitors([
    {exchange: 'BITFINEX', fsym: 'BTC', tsym: 'USD', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'ETH', tsym: 'USD', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'XRP', tsym: 'USD', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'LTC', tsym: 'USD', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'USD', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'BTC', timeframe: '30m', delay: ms('10m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'BTC', tsym: 'USD', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'ETH', tsym: 'USD', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'XRP', tsym: 'USD', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'LTC', tsym: 'USD', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'USD', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'BTC', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'BTC', timeframe: '1h', delay: ms('30m'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'BTC', tsym: 'USD', timeframe: '1d', delay: ms('1h'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'ETH', tsym: 'USD', timeframe: '1d', delay: ms('1h'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'XRP', tsym: 'USD', timeframe: '1d', delay: ms('1h'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'LTC', tsym: 'USD', timeframe: '1d', delay: ms('1h'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'USD', timeframe: '1d', delay: ms('1h'), strategies: strats},
    {exchange: 'BITFINEX', fsym: 'NEO', tsym: 'BTC', timeframe: '1d', delay: ms('1h'), strategies: strats},
  ]);

})();
