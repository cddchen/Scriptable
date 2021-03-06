// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: user-plus;
// 添加require，是为了vscode中可以正确引入包，以获得自动补全等功能

if (typeof require === "undefined") require = importModule;
const { DmYY, Runing } = require("./DmYY");

// @组件代码开始
class Widget extends DmYY {
  constructor(arg) {
    super(arg);
    this.name = "健康行走步数";
    this.en = "healthCenter";
  }

  widgetFamily = "medium";
  maxYearDist = 1500;
  maxMonthDist = 5;
  color1 = Color.orange();
  color2 = new Color("#c5d1dd");
  color3 = new Color("#ebe5d9");
  dataSource = [];
  running = {};

  init = async () => {
    try {
      this.dataSource = await this.getData();
    } catch (e) {
      console.log(e);
    }
  };

  getData = async () => {
    try {
      const fileICloud = FileManager.iCloud();
      const dir = fileICloud.documentsDirectory();
      const path = fileICloud.joinPath(dir, "health.txt");
      const response = fileICloud.readString(path);
      let data = JSON.parse(response);
      if (args.shortcutParameter) data = args.shortcutParameter;
      data.forEach((item) => {
        if (item.health_type === "Walking + Running Distance") {
          item.samples.forEach((run) => {
            const date = run.date.split("T");
            if (!this.running[date[0]]) this.running[date[0]] = 0;
            this.running[date[0]] += parseFloat(run.value);
          });
        }
      });
      Object.keys(this.running).forEach((key) => {
        this.running[key] = Math.floor(this.running[key] * 100) / 100;
      });
    } catch (e) {
      this.notify(
        this.name,
        "健康数据读取失败，请使用健康数据快捷指令更新步数"
      );
      return false;
    }
  };

  /*------------------------------------------------------------------------------
50 km Linien
------------------------------------------------------------------------------*/
  createLines(stack) {
    var canvas, path;
    // 50km Linien
    canvas = new DrawContext();
    canvas.size = new Size(292, 82);
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.setFillColor(new Color("#48484b"));
    path = new Path();
    path.addRect(new Rect(0, 0, 292, 1));
    canvas.addPath(path);
    canvas.fillPath();
    path = new Path();
    path.addRect(new Rect(0, 15, 292, 1));
    canvas.addPath(path);
    canvas.fillPath();
    path = new Path();
    path.addRect(new Rect(0, 30, 292, 1));
    canvas.addPath(path);
    canvas.fillPath();
    path = new Path();
    path.addRect(new Rect(0, 45, 292, 1));
    canvas.addPath(path);
    canvas.fillPath();
    stack.backgroundImage = canvas.getImage();
  }

  async buildWidget(widget) {
    widget.backgroundColor = new Color("#222222");
    // // Stacks definieren
    var stackYear = widget.addStack();
    widget.addSpacer();
    var stackMonth = widget.addStack();
    // Stacks für Symbol und Jahresauswertung aufbereiten
    var stackYear1 = stackYear.addStack();
    stackYear.addSpacer(10);
    var stackYear2 = stackYear.addStack();
    var sym = SFSymbol.named("figure.walk");
    var img = stackYear1.addImage(sym.image);
    img.tintColor = Color.orange();
    img.imageSize = new Size(25, 25);
    stackYear2.layoutVertically();
    var stackYearCurr = stackYear2.addStack();

    let data = {};
    const runningData = Object.keys(this.running);
    if (runningData.length > 12) runningData.splice(0, runningData.length - 12);
    runningData.forEach((date) => {
      const [_, month, day] = date.split("-");
      const stackDay = stackMonth.addStack();
      const value = this.running[date];
      this.createProgressMonth(stackDay, `${month}.${day}`, value);
      stackMonth.addSpacer(4);
      if (!data[month]) data[month] = 0;
      data[month] += value;
    });

    Object.keys(data).forEach((month) => {
      this.createProgressYear(stackYearCurr, "近期", data[month], this.color1);
    });

    // 50km Linie
    this.createLines(stackMonth);
    return widget;
  }

  createProgressYear(stack, year, dist, color) {
    let stackDesc, stackPBar, stackDist, canvas, path, txt, img;

    // Initialisierung
    stack.centerAlignContent();

    // Stacks definieren
    stackDesc = stack.addStack();
    stackPBar = stack.addStack();
    stackDist = stack.addStack();

    // Beschreibung
    stackDesc.size = new Size(30, 0);
    txt = stackDesc.addText(year);
    txt.font = Font.systemFont(7);
    txt.textColor = Color.white();
    stackDesc.addSpacer();

    // Progress-Bar
    canvas = new DrawContext();
    canvas.size = new Size(180, 7);
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.setFillColor(new Color("#48484b"));
    path = new Path();
    path.addRoundedRect(new Rect(0, 0, 180, 5), 3, 2);
    canvas.addPath(path);
    canvas.fillPath();
    canvas.setFillColor(color);
    path = new Path();
    path.addRoundedRect(new Rect(0, 0, (180 * dist) / 200, 5), 3, 2);
    canvas.addPath(path);
    canvas.fillPath();
    img = stackPBar.addImage(canvas.getImage());
    img.imageSize = new Size(180, 7);

    // Distanz
    stackDist.size = new Size(40, 0);
    stackDist.addSpacer();
    txt = stackDist.addText(Math.round(dist).toString() + " km");
    txt.font = Font.systemFont(7);
    txt.textColor = Color.white();
  }

  /*------------------------------------------------------------------------------
Balkenanzeige für Monatsauswertung aufbereiten
------------------------------------------------------------------------------*/
  createProgressMonth(stack, month, dist3) {
    let stackDist, stackPBar, stackDesc, canvas, path, s, img, txt;

    // Stacks definieren
    stack.layoutVertically();
    stackPBar = stack.addStack();
    stack.addSpacer(4);
    stackDesc = stack.addStack();
    stackDist = stack.addStack();

    // Progress-Bar
    canvas = new DrawContext();
    canvas.size = new Size(17, 60);
    canvas.opaque = false;
    canvas.respectScreenScale = true;

    canvas.setFillColor(this.color1);
    path = new Path();
    s = (60 * dist3) / this.maxMonthDist;
    path.addRect(new Rect(6, 60 - s, 8, s));
    canvas.addPath(path);
    canvas.fillPath();
    img = stackPBar.addImage(canvas.getImage());
    img.imageSize = new Size(17, 60);

    // Monat
    stackDesc.size = new Size(20, 10);
    txt = stackDesc.addText(month);
    txt.font = Font.systemFont(7);
    txt.textColor = Color.white();

    // Distanz aktuelle Jahr
    stackDist.size = new Size(17, 8);
    txt = stackDist.addText(Math.round(dist3).toString());
    txt.font = Font.systemFont(6);
    txt.textColor = Color.white();
  }

  setWidget = async (body) => {
    return body;
  };

  renderSmall = async (w) => {
    return await this.setWidget(w);
  };

  renderLarge = async (w) => {
    return await this.setWidget(w);
  };

  renderMedium = async (w) => {
    return await this.setWidget(w);
  };

  /**
   * 渲染函数，函数名固定
   * 可以根据 this.widgetFamily 来判断小组件尺寸，以返回不同大小的内容
   */
  async render() {
    await this.init();
    const widget = new ListWidget();
    await this.buildWidget(widget);
    await this.renderMedium(widget);
    await widget.presentMedium();
    return widget;
  }
}

// @组件代码结束
if (config.runsFromHomeScreen) {
  Runing(Widget);
} else {
  (async () => {
    const M = new Widget();
    await M.render();
  })();
}
