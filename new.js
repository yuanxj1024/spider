var fs = require('fs');
var originRequest = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite')
// var sleep = require('sleep');
var url = require('url');

var firstUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2015/index.html';


var total = 1000;
var headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}

function request(url, callback) {
  var options = {
      url: url,
      encoding: null,
      //代理服务器
      //proxy: 'http://xxx.xxx.xxx.xxx:8888',
      headers: headers
    }
    originRequest(options, callback);
}

// 收集一级省市

function sendRequest(url, callback) {
  // sleep.msleep(1000);
  console.log(url);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var html = iconv.decode(body, 'gb2312')
      var $ = cheerio.load(html);
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

function getUrl(url, target) {
  return url.resolve(url, target);
}

var dataObject = {};

function first() {
  sendRequest(firstUrl, function ($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.provincetr a').each(function () {
      var self = $(this);
      var href = self.attr('href');
      if (href.indexOf('htm') > 1) {
        // var id = href.match(regId)[0] || '';
        var obj = {
          href: href,
          name: self.text(),
          // id: id,
          // children: {}
        };
        // list.push(obj);
        dataObject[self.text()] = obj;
        // second(obj);
      }
    });
    console.log(dataObject);
    // console.log('[success] - 收集' + list.length + '个一级省市');
    // second(list);
  });
}

function second(item) {
  // var temp = [data[0]]
  // data.map(function (item) {
  console.log('[二级] - ', item.name, '处理中');
  sendRequest(firstUrl + item.href, function ($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.parent a').each(function () {
      var self = $(this);
      var href = self.attr('href');
      var obj = {
        href: href,
        name: self.text(),
        // id: getId(href)
      };
      third(item, obj);
      // list.push(obj);
      // dataObject[item.name].children[self.text()] = obj;
    });
    // console.log('[二级] - ', item.name, '收集了', list.length, '个市级');
    // third(item, list);
  });
  // });
}

function third(first, second) {
  // var temp = [secondList[1]];
  // secondList.map(function (item) {
  var item = second;
  console.log('[三级] - ', item.name, '处理中');
  sendRequest(firstUrl + item.href, function ($) {
    if (!$) {
      return;
    }
    $('.parent').each(function () {
      var parent = $(this);
      var third = getObj($(parent.children('a')[0]));
      five(first, item, third);
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
      var parent = $(this);
      var four = getObj($(parent.children('a')[0]));
      console.log('[四级] - ', first.name, second.name, third.name, four.name, '处理中');
      // console.log('four = ', four);
      parent.next('td').find('a').each(function () {
        var five = getObj($(this));
        // console.log('[五级] -', five.name, '保存中...');
        writeFile(toString(first, second, third, four, five));
      });
    });
  });
}

String.prototype.format = function (args) {
  var result = this;
  if (arguments.length > 0) {
    if (arguments.length == 1 && typeof (args) == "object") {
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
    // id: getId(href)
  };

  return obj;
}

var fileData = [
  '1,3,412,3',
  'aaaa',
  'bbbb',
  'ccccc',
  'ddddd'
]



function writeFile(data) {
  // fileData.map(function (data) {
  fs.appendFileSync('data.csv', data + '\r\n');
  // });
}

// writeFile();

first();
