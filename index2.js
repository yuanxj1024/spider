var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sleep = require('sleep');
var argv = process.argv;

var firstUrl = 'http://www.xzqy.net/';

var total = 1000;
var name = '河北';
// var target = '';
if (argv.length > 2 && argv[2]) {
  name = argv[2];
}

// 收集一级省市

function sendRequest(url, callback) {
  sleep.msleep(1600);
  console.log(url);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      callback($);
    } else {
      console.log('[请求失败] - ', url);
      total -= 1;
      if (total > 0) {
        sendRequest(url, callback);
      } else {
        callback();
      }
    }
  });
}

var regId = /\d+/g;

function getId(url) {
  return url.match(regId)[0] || '';
}

var firstData = [];
var dataObject = {};

function first() {
  sendRequest(firstUrl, function ($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.navi a').each(function () {
      try {
        var self = $(this);
        var href = self.attr('href');
        if (href.indexOf('htm') > 1) {
          var id = href.match(regId)[0] || '';
          var obj = {
            href: href,
            name: self.text(),
            id: id,
            children: {}
          };
          // list.push(obj);
          dataObject[self.text()] = obj;
          // second(obj);
        }
      } catch (e) {}
    });
    second(dataObject[name]);
  });
}

function second(item) {
  // var temp = [data[0]] data.map(function (item) {
  console.log('[二级] - ', item.name, '处理中');
  sendRequest(firstUrl + item.href, function ($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.parent a').each(function () {
      try {

        var self = $(this);
        var href = self.attr('href');
        var obj = {
          href: href,
          name: self.text(),
          id: getId(href)
        };
        third(item, obj);
        // list.push(obj); dataObject[item.name].children[self.text()] = obj;
      } catch (e) {
        writeError(e);
      }
    });
  });
  // });
}

function third(first, second) {
  // var temp = [secondList[1]]; secondList.map(function (item) {
  var item = second;
  console.log('[三级] - ', item.name, '处理中');
  sendRequest(firstUrl + item.href, function ($) {
    if (!$) {
      return;
    }
    $('.parent')
      .each(function () {
        try {

          var parent = $(this);
          var third = getObj($(parent.children('a')[0]));
          five(first, item, third);
        } catch (e) {
          writeError(e);
        }
      });
  });
  // });
}

function five(first, second, third) {
  sendRequest(firstUrl + third.href, function ($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.parent').each(function () {
      try {
        var parent = $(this);
        var four = getObj($(parent.children('a')[0]));
        console.log('[四级] - ', first.name, second.name, third.name, four.name, '处理中');
        parent
          .next('td')
          .find('a')
          .each(function () {
            try {
              var five = getObj($(this));
              writeFile(toString(first, second, third, four, five));
            } catch (e) {
              writeError(e);
            }
          });
      } catch (e) {
        writeError(e);
      }
    });
  });
}

String.prototype.format = function (args) {
  var result = this;
  if (arguments.length > 0) {
    if (arguments.length == 1 && typeof(args) == "object") {
      for (var key in args) {
        if (args[key] != undefined) {
          var reg = new RegExp("({" + key + "})", "g");
          result = result.replace(reg, args[key]);
        }
      }
    } else {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] != undefined) {
          //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出

          var reg = new RegExp("({)" + i + "(})", "g");
          result = result.replace(reg, arguments[i]);
        }
      }
    }
  }
  return result;
}

// id，北京，id,市级，id，区级,id,
function toString(first, second, third, four, five) {
  var template = '{0},{1},{2},{3},{4},\r\n';
  return template.format(first.name, second.name, third.name, four.name, five.name);
};

function getObj(self) {
  if (!self) {
    return null;
  }
  // var self = $(tag);
  var href = self.attr('href');
  var obj = {
    href: href,
    name: self.text(),
    id: getId(href)
  };

  return obj;
}

function writeFile(data) {
  fs.appendFileSync(name + '.data.csv', data + '\r\n');
}

function writeError(e) {
  fs.appendFileSync('error.txt', JSON.stringify(e) + '\r\n');
}

first();