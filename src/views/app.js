// autolink
var autoLink = function(str) {
  var __slice = [].slice;
  var k, linkAttributes, option, options, pattern, v;
  options = 1 <= arguments.length ? __slice.call(arguments, 0) : [];

  pattern = /(^|[\s\n]|<br\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;
  if (!(options.length > 0)) {
    return str.replace(pattern, "$1<a href='$2'>$2</a>");
  }
  option = options[0];
  linkAttributes = ((function() {
    var _results;
    _results = [];
    for (k in option) {
      v = option[k];
      if (k !== 'callback') {
        _results.push(" " + k + "='" + v + "'");
      }
    }
    return _results;
  })()).join('');
  return str.replace(pattern, function(match, space, url) {
    var link;
    link = (typeof option.callback === "function" ? option.callback(url) : void 0) || ("<a href='" + url + "'" + linkAttributes + ">" + url + "</a>");
    return "" + space + link;
  });
};

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var cardRegex = /^\[(\w*) (.*)\]$/

var cards = {
  'photo': function(value) {
    return '<a href="{value}"><img src="{value}" style="max-height:300px;max-width:300px"/></a>'.replace(/{value}/g, htmlEntities(value))
  }
}

function cardReplacer(all, key, value){
  card = cards[key.toLowerCase()]
  return card ? card(value) : all
}


function cardsReplacer(str){
  return str.replace(/^\[(\w*) (.*)\]$/, cardReplacer);
}

function formatMessage(str) {
  if (str.match(cardRegex)) return cardsReplacer(str)
  else return autoLink(htmlEntities(str))
}

function WsManager(){
  this.ws = null;
  this.listeners = {};
}


WsManager.prototype.on = function(eventName, listener, store) {
  if(this.ws) this.ws.addEventListener(eventName, listener);
  if (store !== false) {
    this.listeners[eventName] = this.listeners[eventName] || []
    this.listeners[eventName].push(listener)
  }
}

WsManager.prototype._bindListeners = function() {
  for(eventName in this.listeners) {
    this.listeners[eventName].forEach(function(listener) {
      this.on(eventName, listener, false)
    }, this)
  }
}

WsManager.prototype.open = function(url, err, ok) {
  if (this.ws){
    this.close(function(_) { this._open(url, err, ok); }.bind(this));
  } else {
    this._open(url, err, ok);
  }
  return this
}

WsManager.prototype.close = function(listener) {
  if (!this.ws || this.closed) return listener(null)
  if (listener) this.on('close', listener, false);
  this.ws.close();
}

WsManager.prototype.send = function(event, err){
  err = err || console.error.bind(console)
  if (!this.ws) return err('Not connected');
  if(this.connecting) {
    return this.on('open', function(_) { this.send(event, err) }.bind(this), false)
  }
  try {
    if (this.opened) this.ws.send(event)
    else err('WebSocket is already in CLOSING or CLOSED state.')
  } catch (ex) {
    err(ex)
  }
}

WsManager.prototype._open = function(url, err, ok) {
  try {
    this.ws = new WebSocket(url);
    this._bindListeners()
    this.on('open', function(event){ if (ok) ok(this, event) }.bind(this), false)
  } catch (ex) {
    this.ws = null
    if (err) err(ex)
    else console.error(ex)
  }
}

Object.defineProperty(WsManager.prototype, 'closed', {
  get: function() { return !this.ws || this.ws.readyState === WebSocket.CLOSED; }
})

Object.defineProperty(WsManager.prototype, 'connecting', {
  get: function() { return this.ws && this.ws.readyState === WebSocket.CONNECTING; }
})

Object.defineProperty(WsManager.prototype, 'opened', {
  get: function() { return this.ws && this.ws.readyState === WebSocket.OPEN; }
})

Object.defineProperty(WsManager.prototype, 'closing', {
  get: function() { return this.ws && this.ws.readyState === WebSocket.CLOSING; }
})

wsm = new WsManager()

// wsm.on('message', function(ev){
//   console.log(ev)
//   console.log(ev.data)
// })

// wsm.open('ws://localhost:8001/', null, function(wsm, event){
//   console.log(wsm.ws)
//   console.log(wsm.ws.readyState)
// })

// wsm.send("echo holaholahola no duermas sola")

function D(dom){ this.dom = dom }
D.prototype.show = function() { this.dom.style.display = 'block' };
D.prototype.hide = function() { this.dom.style.display = 'none' };
D.prototype.on = function(event, listener, useCapture) { this.dom.addEventListener(event, listener, useCapture) };
D.prototype.focus = function() { this.dom.focus() };
D.prototype.clone = function() { return new D(this.dom.cloneNode(true)) };
D.prototype.insertBefore = function(newElement, anchor){ return new D(this.dom.insertBefore(newElement.dom, anchor.dom)); }
D.prototype.removeClass = function(className){ this.dom.classList.remove(className); }
D.prototype.addClass = function(className){ this.dom.classList.add(className) }
D.prototype.$ = function(selector){ return new D(this.dom.querySelector(selector)) }

Object.defineProperty(D.prototype, 'value', {
  get: function() { return this.dom.value; },
  set: function(newValue) { this.dom.value = newValue; }
})

Object.defineProperty(D.prototype, 'text', {
  get: function() { return this.dom.textContent; },
  set: function(newValue) { this.dom.textContent = newValue; }
})

Object.defineProperty(D.prototype, 'html', {
  get: function() { return this.dom.innerHTML; },
  set: function(newValue) { this.dom.innerHTML = newValue; }
})

Object.defineProperty(D.prototype, 'parent', {
  get: function() { return new D(this.dom.parentElement); }
})

function $$(selector) {
  if (typeof selector === 'string' || selector instanceof String) {
    return $$(document).$(selector);
  }
  return new D(selector);
}

function ready() {
  $$('.connect').show();
  $$('.disconnect').hide();

  $$('.connect').on('click', function() { connect($$('.url').value); });
  $$('.disconnect').on('click', function() { disconnect(); });

  $$('.url').focus();
  $$('.url').on('keydown', function(ev) {
    var code = ev.which || ev.keyCode;
    // Enter key pressed
    if (code  == 13) {
      updatePageUrl();
      connect($$('.url').value);
    }
  });
  $$('.url').on('change', updatePageUrl);

  $$('.send-input').on('keydown', function(ev) {
    var code = ev.which || ev.keyCode;
    // Enter key pressed
    if (code == 13) {
      var msg = $$('.send-input').value;
      $$('.send-input').value = '';
      send(msg);
    }
    // Up key pressed
    if (code == 38) {
      moveThroughSendHistory(1);
    }
    // Down key pressed
    if (code == 40) {
      moveThroughSendHistory(-1);
    }
  });
  $$(window).on('popstate', updateWebSocketUrl);
  updateWebSocketUrl();
}

function updatePageUrl() {
  var match = $$('.url').value.match(new RegExp('^(ws)(s)?://([^/]*)(/.*)$'));
  if (match) {
    var pageUrlSuffix = match[4];
    if (history.state != pageUrlSuffix) {
      history.pushState(pageUrlSuffix, pageUrlSuffix, pageUrlSuffix);
    }
  }
}

function updateWebSocketUrl() {
  var match = location.href.match(new RegExp('^(http)(s)?://([^/:]*)(:\d*)?(/.*)$'));
  if (match) {
    var wsUrl = 'ws' + (match[2] || '') + '://' + match[3] + ':8001' + match[5];
    $$('.url').value = wsUrl;
  }
}

function appendMessage(type, data) {
  var template = $$('.message.template');
  var el = template.parent.insertBefore(template.clone(), $$('.message.type-input'));
  el.removeClass('template');
  el.addClass('type-' + type.toLowerCase());
  el.$('.message-type').text = type;
  el.$('.message-data').html = formatMessage(data || '') + '&nbsp;';
  el.dom.scrollIntoView(true);
}

function connect(url) {
  wsm.open(url,
    function(){
      appendMessage('exception', 'Cannot connect: ' + ex);
    },
    function(){
      $$('.connect').hide();
      $$('.disconnect').show();
      $$('.send-input').focus();
    }
  )
  appendMessage('open', url)
}

wsm.on('open', function(ev) {
  appendMessage('onopen');
});

wsm.on('close', function(ev) {
  appendMessage('close');
  $$('.connect').show();
  $$('.disconnect').hide();
  appendMessage('onclose', '[Clean: ' + ev.wasClean + ', Code: ' + ev.code + ', Reason: ' + (ev.reason || 'none') + ']');
  $$('.url').focus();
});

wsm.on('message', function(ev) {
  appendMessage('onmessage', ev.data);
});

wsm.on('error', function(ev) {
  appendMessage('onerror');
});

wsm.on('close', function(){
})

function disconnect() {
  wsm.close()
}

function send(msg) {
  appendToSendHistory(msg);
  appendMessage('send', msg);

  if (wsm.closed) connect($$('.url').value)
  wsm.send(msg, function(ex){ appendMessage('exception', 'Cannot send: ' + ex) })
}


var maxSendHistorySize = 100;
  currentSendHistoryPosition = -1,
  sendHistoryRollback = '';

function appendToSendHistory(msg) {
  currentSendHistoryPosition = -1;
  sendHistoryRollback = '';
  var sendHistory = JSON.parse(localStorage['websocketdconsole.sendhistory'] || '[]');
  if (sendHistory[0] !== msg) {
    sendHistory.unshift(msg);
    while (sendHistory.length > maxSendHistorySize) {
      sendHistory.pop();
    }
    localStorage['websocketdconsole.sendhistory'] = JSON.stringify(sendHistory);
  }
}

function moveThroughSendHistory(offset) {
  if (currentSendHistoryPosition == -1) {
    sendHistoryRollback = $$('.send-input').value;
  }
  var sendHistory = JSON.parse(localStorage['websocketdconsole.sendhistory'] || '[]');
  currentSendHistoryPosition += offset;
  currentSendHistoryPosition = Math.max(-1, Math.min(sendHistory.length - 1, currentSendHistoryPosition));

  var el = $$('.send-input');
  el.value = currentSendHistoryPosition == -1
    ? sendHistoryRollback
    : sendHistory[currentSendHistoryPosition];
  setTimeout(function() {
    el.dom.setSelectionRange(el.value.length, el.value.length);
  }, 0);
}

$$(document).on("DOMContentLoaded", ready, false);

