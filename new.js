var fs = require('fs');
var originRequest = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite')
// var sleep = require('sleep');
var url = require('url');

var firstUrl = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2015/index.html';


var total = 1000;
var name = '天津市';


var headers = {
  'Host': 'www.stats.gov.cn',
  'Cookie': 'AD_RS_COOKIE=20081684',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2171.65 Safari/537.36'
};

function request(url, callback) {
  var options = {
    url: url,
    encoding: null,
    //代理服务器
    //proxy: 'http://xxx.xxx.xxx.xxx:8888',
    headers: headers
  }
  // setTimeout(function() {
  originRequest(options, callback);
  // }, 1000);
}

// 收集一级省市

function sendRequest(url, callback) {
  // sleep.msleep(1000);
  console.log(url);
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('[请求完成] - ', url);
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

function getUrl(path, target) {
  return url.resolve(path, target);
}

var dataObject = {};
var regName = /^\D+$/;

function first() {
  console.log('[省级] - ', name, '处理中');
  sendRequest(firstUrl, function($) {
    if (!$) {
      return;
    }
    var list = [];
    $('.provincetr a').each(function() {
      var self = $(this);
      var href = self.attr('href');
      if (href.indexOf('htm') > 1) {
        // var id = href.match(regId)[0] || '';
        var obj = {
          href: href,
          name: self.text(),
          url: getUrl(firstUrl, href),
          children: {},
        };
        dataObject[self.text()] = obj;
      }
    });
    var temp = dataObject[name];
    // console.log(temp, getUrl(firstUrl, temp.href));
    second(temp);
  });
}

function second(item) {
  // var temp = [data[0]]
  // data.map(function (item) {
  console.log('[市级] - ', item.name, '处理中');
  sendRequest(item.url, function($) {
    if (!$) {
      return;
    }
    $('.citytr a').each(function() {
      var self = $(this);
      var obj = getObj(self, item.url);
      console.log('222', obj);
      if (obj) {
        third(item, obj);
        // dataObject[item.name].children[self.text()] = obj;
      }
      // var href = self.attr('href');
      // if (regName.test(self.text())) {
      //   var obj = {
      //     // href: href,
      //     name: self.text(),
      //     url: getUrl(item.url, href),
      //   };
      //   third(item, obj);
      //   dataObject[item.name].children[self.text()] = obj;
      // }
    });
    // console.log(1111, dataObject[item.name]);
  });
  // });
}

function third(first, second) {
  // var temp = [secondList[1]];
  // secondList.map(function (item) {
  var item = second;
  console.log('[区级] - ', item.name, '处理中');
  sendRequest(second.url, function($) {
    if (!$) {
      return;
    }
    $('.countytr a').each(function() {
      var self = $(this);
      var obj = getObj(self, second.url);
      if (obj) {
        five(first, second, obj);
      }
    });
  });
  // });
}

function five(first, second, third) {
  console.log('[办事处、镇级] - ', item.name, '处理中');
  sendRequest(third.url, function($) {
    if (!$) {
      return;
    }
    $('.towntr a').each(function() {
      var self = $(this);
      var obj = getObj(self, third.url);
      if (obj) {
        six(first, second, third, obj);
      }
    });
  });
}

function six(first, second, third, four) {
  console.log('[委会级] - ', item.name, '处理中');
  sendRequest(four.url, function($) {
    if (!$) {
      return;
    }
    $('.villagetr td').each(function() {
      var self = $(this);
      var obj = getObj(self, four.url);
      if (obj) {
        writeFile(toString(first, second, third, four, obj));
      }
    });
  });
}


String.prototype.format = function(args) {
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

function getObj(self, path) {
  if (!self) {
    return null;
  }
  if (regName.test(self.text())) {
    var href = self.attr('href');
    var obj = {
      // href: href,
      name: self.text(),
      url: getUrl(path, href),
    };

    return obj;
  }
  return null;
}


function writeFile(data) {
  fs.appendFileSync(name + '.data.csv', data + '\r\n');
}


first();
