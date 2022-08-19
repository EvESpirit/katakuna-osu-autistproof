const IPCError = Error;
const UUID = require("uuid").v4;
const EventEmitter = require('events');

class Controller {
  constructor() {
    this.ipc = require('node-ipc');
    this.ipc.config.id = 'katakunaclient';
    this.ipc.config.retry = 1000;
    this.ipc.config.silent = true;
    this.connected = false;
    this.retry_count = 0;
    this.queue = [];
    this.message_cb = undefined;
  }

  send_and_receive_message_async(message) {
    return new Promise((resolve) => {
      if(!this.connected) return null;
      const msg_id = UUID();
      this.queue[msg_id] = {"status": "awaiting"};
      this.ipc.of.katakuna.emit('katakuna.action', {
            id: msg_id,
            data: message
      });
      this.queue[msg_id].success_cb = () => {
        const s = this.queue[msg_id].response;
        this.queue[msg_id] = undefined;
        resolve(s);
      };
    });
  }

  setMessageCallback(cb) {
    this.message_cb = cb;
  }

  connect() {
    return new Promise((r, f) => {
      this.ipc.connectTo("katakuna", '/tmp/katakuna-if', () => {
          this.ipc.of.katakuna.on('connect', () => {
            console.log('## connected to katakuna ##');
            this.connected = true;
            this.retry_count = 0;
            if(r) r();
          });

          this.ipc.of.katakuna.on('error', (e) => {
            if(e.code == "ECONNREFUSED") {
              this.retry_count++;
              console.log(`Retrying to connect... (try ${this.retry_count})`);
            }
          });

          this.ipc.of.katakuna.on('disconnect', () => {
            this.connected = false;
            console.log('## disconnected from katakuna ##');
          });

          this.ipc.of.katakuna.on('katakuna.action', (data) => {
            console.log("## received message from server ##");
            if(this.queue[data.id] !== undefined) {
              this.queue[data.id].status = "success";
              this.queue[data.id].response = data.data;
              this.queue[data.id].success_cb();
            } else {
              console.log("katakuna received a new message from server!!");
              if(this.message_cb)
                this.message_cb(data);
            }
          });
      });
    });
  }

  find_by_username(user) {
    return new Promise((r, f) => {
      this.send_and_receive_message_async({
        "type": "request",
        "request": {
          "type": "user",
          "name": user
        }
      }).then((response) => {
        if(response.operation == "ok") {
          r(response.response);
        } else {
          r();
          throw new Error(response.operation);
        }
      });
    });
  }

  trollUser(user_id, mode, message) {
    return new Promise((r, f) => {
      const allowed_troll_modes = ["notification", "jumpscare", "chat_attention", "force_exit"];
      const message_troll_modes = ["notification", "jumpscare"];

      if(!allowed_troll_modes.includes(mode)) {
        throw new Error("The allowed troll modes are: notification, jumpscare, chat_attention, force_exit");
      }

      if(message_troll_modes.includes(mode) && (message == undefined || message.length < 1)) {
        throw new Error("Please provide a message");
      }

      this.send_and_receive_message_async({
        "type": "action",
        "action": {
          "type": "troll",
          "user_id": user_id,
          "mode": mode,
          "message": message
        }
      }).then((response) => {
        if(response.operation == "ok") {
          r("ok");
        } else {
          f(response.operation);
          throw new Error(response.operation);
        }
      });
    });
  }
}

class BotClient extends EventEmitter {
  constructor() {
    super();
    this.user_data = {
      "user": {
        "name": "BotUsername",
        "id": 0,
        "rankedScore": 0,
        "totalScore": 0,
        "timezone": 24,
        "country": 0,
        "longitude": 0,
        "latitude": 0,
        "userRank": 4,
        "avatar": undefined
      }
    };
    this.controller = new Controller();
    this.msg_cb = (msg) => {
      console.log("message");
      console.log(msg);
    };
  }

  set avatar(avatar) {
    this.user_data.user.avatar = avatar;
  }

  set country(c) {
    this.user_data.user.country = c;
  }

  setLocation(lat, long) {
    this.user_data.user.longitude = long;
    this.user_data.user.latitude = lat;
  }

  set user_id(id) {
    this.user_data.user.id = id;
  }

  set user_name(name) {
    this.user_data.user.name = name;
  }

  set score(score) {
    this.user_data.totalScore = score;
  }

  set rankedScore(score) {
    this.user_data.rankedScore = score;
  }

  connect() {
      return new Promise((r) => {
        this.controller.setMessageCallback(this.msg_cb);
        this.controller.connect().then(() => {
          this.controller.send_and_receive_message_async({
            "type": "register",
            "register": {
              "type": "bot",
              "user_data": this.user_data.user
            }
          }).then((response) => {
            console.log(response);
            r();
          });
        });
      });
  }
}

class Country {
  static getCountry(c) {
    const countryCodes = {
  			"LV": 132,
  			"AD": 3,
  			"LT": 130,
  			"KM": 116,
  			"QA": 182,
  			"VA": 0,
  			"PK": 173,
  			"KI": 115,
  			"SS": 0,
  			"KH": 114,
  			"NZ": 166,
  			"TO": 215,
  			"KZ": 122,
  			"GA": 76,
  			"BW": 35,
  			"AX": 247,
  			"GE": 79,
  			"UA": 222,
  			"CR": 50,
  			"AE": 0,
  			"NE": 157,
  			"ZA": 240,
  			"SK": 196,
  			"BV": 34,
  			"SH": 0,
  			"PT": 179,
  			"SC": 189,
  			"CO": 49,
  			"GP": 86,
  			"GY": 93,
  			"CM": 47,
  			"TJ": 211,
  			"AF": 5,
  			"IE": 101,
  			"AL": 8,
  			"BG": 24,
  			"JO": 110,
  			"MU": 149,
  			"PM": 0,
  			"LA": 0,
  			"IO": 104,
  			"KY": 121,
  			"SA": 187,
  			"KN": 0,
  			"OM": 167,
  			"CY": 54,
  			"BQ": 0,
  			"BT": 33,
  			"WS": 236,
  			"ES": 67,
  			"LR": 128,
  			"RW": 186,
  			"AQ": 12,
  			"PW": 180,
  			"JE": 250,
  			"TN": 214,
  			"ZW": 243,
  			"JP": 111,
  			"BB": 20,
  			"VN": 233,
  			"HN": 96,
  			"KP": 0,
  			"WF": 235,
  			"EC": 62,
  			"HU": 99,
  			"GF": 80,
  			"GQ": 87,
  			"TW": 220,
  			"MC": 135,
  			"BE": 22,
  			"PN": 176,
  			"SZ": 205,
  			"CZ": 55,
  			"LY": 0,
  			"IN": 103,
  			"FM": 0,
  			"PY": 181,
  			"PH": 172,
  			"MN": 142,
  			"GG": 248,
  			"CC": 39,
  			"ME": 242,
  			"DO": 60,
  			"KR": 0,
  			"PL": 174,
  			"MT": 148,
  			"MM": 141,
  			"AW": 17,
  			"MV": 150,
  			"BD": 21,
  			"NR": 164,
  			"AT": 15,
  			"GW": 92,
  			"FR": 74,
  			"LI": 126,
  			"CF": 41,
  			"DZ": 61,
  			"MA": 134,
  			"VG": 0,
  			"NC": 156,
  			"IQ": 105,
  			"BN": 0,
  			"BF": 23,
  			"BO": 30,
  			"GB": 77,
  			"CU": 51,
  			"LU": 131,
  			"YT": 238,
  			"NO": 162,
  			"SM": 198,
  			"GL": 83,
  			"IS": 107,
  			"AO": 11,
  			"MH": 138,
  			"SE": 191,
  			"ZM": 241,
  			"FJ": 70,
  			"SL": 197,
  			"CH": 43,
  			"RU": 0,
  			"CW": 0,
  			"CX": 53,
  			"TF": 208,
  			"NL": 161,
  			"AU": 16,
  			"FI": 69,
  			"MS": 147,
  			"GH": 81,
  			"BY": 36,
  			"IL": 102,
  			"VC": 0,
  			"NG": 159,
  			"HT": 98,
  			"LS": 129,
  			"MR": 146,
  			"YE": 237,
  			"MP": 144,
  			"SX": 0,
  			"RE": 183,
  			"RO": 184,
  			"NP": 163,
  			"CG": 0,
  			"FO": 73,
  			"CI": 0,
  			"TH": 210,
  			"HK": 94,
  			"TK": 212,
  			"XK": 0,
  			"DM": 59,
  			"LC": 0,
  			"ID": 100,
  			"MG": 137,
  			"JM": 109,
  			"IT": 108,
  			"CA": 38,
  			"TZ": 221,
  			"GI": 82,
  			"KG": 113,
  			"NU": 165,
  			"TV": 219,
  			"LB": 124,
  			"SY": 0,
  			"PR": 177,
  			"NI": 160,
  			"KE": 112,
  			"MO": 0,
  			"SR": 201,
  			"VI": 0,
  			"SV": 203,
  			"HM": 0,
  			"CD": 0,
  			"BI": 26,
  			"BM": 28,
  			"MW": 151,
  			"TM": 213,
  			"GT": 90,
  			"AG": 0,
  			"UM": 0,
  			"US": 225,
  			"AR": 13,
  			"DJ": 57,
  			"KW": 120,
  			"MY": 153,
  			"FK": 71,
  			"EG": 64,
  			"BA": 0,
  			"CN": 48,
  			"GN": 85,
  			"PS": 178,
  			"SO": 200,
  			"IM": 249,
  			"GS": 0,
  			"BR": 31,
  			"GM": 84,
  			"PF": 170,
  			"PA": 168,
  			"PG": 171,
  			"BH": 25,
  			"TG": 209,
  			"GU": 91,
  			"CK": 45,
  			"MF": 252,
  			"VE": 230,
  			"CL": 46,
  			"TR": 217,
  			"UG": 223,
  			"GD": 78,
  			"TT": 218,
  			"TL": 0,
  			"MD": 0,
  			"MK": 0,
  			"ST": 202,
  			"CV": 52,
  			"MQ": 145,
  			"GR": 88,
  			"HR": 97,
  			"BZ": 37,
  			"UZ": 227,
  			"DK": 58,
  			"SN": 199,
  			"ET": 68,
  			"VU": 234,
  			"ER": 66,
  			"BJ": 27,
  			"LK": 127,
  			"NA": 155,
  			"AS": 14,
  			"SG": 192,
  			"PE": 169,
  			"IR": 0,
  			"MX": 152,
  			"TD": 207,
  			"AZ": 18,
  			"AM": 9,
  			"BL": 0,
  			"SJ": 195,
  			"SB": 188,
  			"NF": 158,
  			"RS": 239,
  			"DE": 56,
  			"EH": 65,
  			"EE": 63,
  			"SD": 190,
  			"ML": 140,
  			"TC": 206,
  			"MZ": 154,
  			"BS": 32,
  			"UY": 226,
  			"SI": 194,
  			"AI": 7
  	};
    return countryCodes[c.toUpperCase()];
  }
}

exports.Controller = Controller;
exports.BotClient = BotClient;
exports.Country = Country;
