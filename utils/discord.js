const path = require('path');
const { equalObjects } = require('./funcs.js');
const fs = require('fs');
const ms = require('ms');
const tvScreen = require('./../tv/tvsnap.js');
const Discord = require('discord.js');
const bot = new Discord.Client();
const _CHANNEL_COMMANDS = "679382325192294422";
const _CHANNEL_ALERTS = "679667709541351446";
const _COMMAND_STATUS = 'status';
const _COMMAND_SCAN = 'scan';
const _TOKEN = '';
const _ADMIN_ID = [''];
const _URL_ICONS = 'https://github.com/atomiclabs/cryptocurrency-icons/raw/master/{SIZE}/color/{NAME}.png';
const _URL_SIGNALTYPE = {
  up: path.resolve('./img/triangle_up.png'),
  down: path.resolve('./img/triangle_down.png')
};


class marketAnalyzer {
  constructor(token = _TOKEN, cmdChannel = _CHANNEL_COMMANDS, adminId = _ADMIN_ID) {
    this.token = token;
    this.cmdChannel = cmdChannel;
    this.adminId = adminId;
    this.bot = bot;
    this.alertsDone = [];
    bot.login(this.token);
    bot.on('ready', this.ready);
    bot.on('message', this.message)
  }

  ready = () => {
    console.info(`Logged in as ${bot.user.tag}!`);
  };

  message = async (msg) => {
    if (msg.channel.id === this.cmdChannel &&  this.adminId.indexOf(msg.author.id) !== -1) {
      const msgCmd = this.parseCommand(msg.content);
      if (msgCmd) {
        switch (msgCmd.cmd) {
          case _COMMAND_STATUS:
            const monLength = monitor.activeMonitors.length;
            const monString = monitor.activeMonitors
              .reduce( (ret, mon) => ret += mon.monitorIndex + ' ' + mon.exchange + '\n', '');

            msg.channel.send(`Monitors number: ${monLenght}\n${monString}`);
            break;
          case _COMMAND_SCAN:
            // scan coin
            if (msgCmd.length === 3) {
              const exchange = msgCmd.args[0];
              const fsym = msgCmd.args[1];
              const tsym = msgCmd.args[2];
              const tf = msgCmd.args[3];
              const ret = await this.scanCoin(exchange, fsym, tsym, tf);
              msg.channel.send('scan');
            }
            else {
              msg.channel.send('scan - invalid arguments');
            }
            break;
          default:
            msg.channel.send('no command detected');
        }
      }
    }
  };

  parseCommand(msg) {
    if (!msg.startsWith('!')) return false;
    const commands = msg.substr(1).split(' ');
    return {
      cmd : commands[0],
      args : commands.shift().split(' ')
    }
  }

  alertIsDone(msg) {
    for (let i = 0; i < this.alertsDone.length; i++) {
      if (equalObjects(this.alertsDone[i], msg) ||
        (msg.currentStackIndex === this.alertsDone[i].currentStackIndex)) {
        return true;
      }
    }
    return false;
  }

  makeIconUrl = (name, size) => _URL_ICONS.replace('{NAME}', name.toLowerCase()).replace('{SIZE}', size);

 async sendAlert(cfg) {

    if(this.alertIsDone(cfg)) return;
    try {
      this.alertsDone.push(cfg);

      const tvShot = new tvScreen(monitor.activeMonitors[cfg.monitorIndex].indicators);
      const tvSnapshot = await tvShot.getScreenshot(cfg.exchange, cfg.fsym, cfg.tsym, cfg.timeframe);
      const imgDirection = (cfg.alertDir.up ? _URL_SIGNALTYPE.up : cfg.alertDir.down ? _URL_SIGNALTYPE.down : '');

      const richAlert = {
        color: cfg.alertDir.up ? 0x00CC00 : cfg.alertDir.down ? 0xCC0000 : 0x0099ff,
        author: {
          name: `${cfg.exchange} `,
        },
        title: `${cfg.coinpair} - ${ms(ms(cfg.timeframe), {long: true}).toUpperCase()}`,
        thumbnail: {
          url: this.makeIconUrl(cfg.fsym, 128),
        },
        fields: cfg.indicators.map(v => ({...v, inline: true})),
        description: `${cfg.currentPrice} ${cfg.tsym.toUpperCase()}`,
        image: {
          url: 'attachment://' + path.basename(tvSnapshot),
        },
        footer: {
          text: cfg.message,
          icon_url: 'attachment://' + path.basename(imgDirection),
        }
      };

      this.bot.channels.get(_CHANNEL_ALERTS).send({
        files: [
          new Discord.Attachment(tvSnapshot),
          new Discord.Attachment(imgDirection)
        ],
        embed: richAlert
      });
      setTimeout(() => fs.unlinkSync((tvSnapshot)), 60000);
    }
    catch(e) {
      console.error(e);
      bot.login(this.token);
      setTimeout(() => sendAlert(cfg), 5000)
    }
  }

  async scanCoin (exchange, fsym, tsym, tf) {
    return {
      then: (resolve, reject) => {
        console.log({exchange, fsym, tsym, tf});
        resolve();
      }
    }
  }

}

module.exports = marketAnalyzer;
