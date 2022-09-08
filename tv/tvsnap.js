const Nightmare = require('nightmare');
const fs = require('fs');
const path = require('path');

const indicatorsPath = path.resolve('./tv/indicators/');
const initDarkPath = path.resolve('./tv/initDark.json');

class tvScreen {
  constructor(indicators) {
    this.indicators = indicators || [];
    this.preload = path.resolve('./tv/preloads/' + new Date().getTime() + '_preload.js');
    this.preparePreload();
  }

  preparePreload() {

    const initData = JSON.parse(fs.readFileSync(initDarkPath));

    for(const indicator of this.indicators) {
      let jsData = fs.readFileSync(path.resolve(`${indicatorsPath}/${indicator.name}.json`)).toString();

      for(const settingKey of Object.keys(indicator.settings)) {
        jsData = jsData.replace(`{${settingKey}}`, indicator.settings[settingKey])
      }

      jsData = JSON.parse(jsData);

      jsData.id = Math.random().toString(36).substring(6);
      jsData.zorder = Math.floor(Math.random()*(200-100+1)+100);

      if (jsData.addTo === 'mainchart') {

        /** MAIN CHART PANEL */
        initData.charts[0].panes[0].sources.push(jsData);

        /** SCALE INDICATORS TO PRICE */
        initData.charts[0].panes[0].rightAxisesState[0].sources.push(jsData.id)
      }
      else if (jsData.addTo === 'newpane') {

        /** NEW PANEL */
        initData.charts[0].panes.push(jsData);
      }

    }

    const preload = fs.readFileSync(path.resolve('./tv/injector.js'))
      .toString()
      .replace('{INJECTION}', JSON.stringify(initData));

    fs.writeFileSync(this.preload, preload);
  }

  intervalToKeys = (interval) => interval.includes('m') ? interval.replace('m', '') : interval;

  getScreenshot(exchange, fsym, tsym, interval) {
    const nightmare = Nightmare({
      show: false,
      webPreferences: {
        preload: path.resolve(this.preload)
      }
    });

    return {
      then: async (resolve, reject) => {
        const url = `https://www.tradingview.com/chart/?symbol=${exchange}:${fsym}${tsym}`;
        const ts = new Date().getTime();
        const filename = path.resolve(`${exchange}-${fsym}-${tsym}-${ts}.png`);
        await nightmare
          .viewport( 1920, 1080 )
          .goto(url)
          .type('body', '0')
          .type('body', this.intervalToKeys(interval))
          .wait(500)
          .type('body', '\u000d')
          .wait(5000)
          .evaluate( () => {
            $('div[data-id]').each(function() {
              if (!$(this).first().attr('class')) this.remove()
            });
            $('.tv-floating-toolbar.tv-trading-toolbar.ui-draggable').remove();
            $('.apply-common-tooltip.common-tooltip-vertical.common-tooltip-otl').click();
            $('#header-toolbar-fullscreen').click();
            $('.tv-exit-fullscreen-button').remove();
          })
          .wait(1000)
          .screenshot(filename, {
            width: 1920,
            x: 0,
            height: 981,
            y: 1,
          })
          .end()
          .then(() => {
            fs.unlinkSync(this.preload);
            resolve(filename);
          })
          .catch(e => reject(e));
      }
    }
  };
}

module.exports = tvScreen;

