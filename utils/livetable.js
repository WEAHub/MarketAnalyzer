const Table = require('cli-table');

const _DEF_COLS = ['hh:mm:ss', 'exchange', 'pair', 'time', 'value', 'strats', 'status', 'delay'];

class liveTable {
  constructor(columns = _DEF_COLS, rows = [], interval = 1000) {
    this.columns = columns;
    this.rows = rows;
    this.intervalDelay = interval;
    this.updateTable = true;
    this.intervalRef = null;
    this.start();
  }

  update() {
    this.updateTable = true;
  }

  stop() {
    this.updateTable = false;
    clearInterval(this.intervalRef);
  }

  start() {
    this.intervalRef = setInterval(() => {
      if (this.updateTable) {
        this.drawTable();
        this.updateTable = false;
      }
    }, this.intervalDelay);
  }

  makeTable() {
    const table = new Table({
      head: this.columns,
      style: {
        head: ['gray']
      }
    });

    this.rows.forEach(v => table.push(v));
    return table;
  }

  drawTable() {
    const table = this.makeTable();
    console.clear();
    console.log(table.toString());

  };

}

module.exports = liveTable;
