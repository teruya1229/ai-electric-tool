/**
 * 受付マスター ← schedule-dashboard.html 取込
 *
 * 主関数: syncScheduleDashboardHtmlToReceptionMaster
 *
 * 事前準備:
 * 1) SCHEDULE_DASHBOARD_HTML に HTML 文字列を貼り付ける
 * 2) シート名 RECEPTION_SHEET_NAME が実シート名と一致しているか確認
 * 3) AA/AB 列が既存運用と衝突する場合は COL.KEY / COL.SYNCED を変更
 */

/** HTML をここに貼り付け（最短・文字列定数） */
var SCHEDULE_DASHBOARD_HTML = '';

/** 受付マスターシート名 */
var RECEPTION_SHEET_NAME = '受付マスター';

/** データ開始行（この行より上は触らない） */
var DATA_START_ROW = 22;

/** 列番号（A=1）。非表示列があっても実列固定。 */
var COL = {
  DATE: 2,      // B
  TIME: 3,      // C
  SOURCE: 4,    // D
  CUSTOMER: 5,  // E
  PHONE: 6,     // F
  ADDR: 8,      // H（メモを住所列へ）
  WORK: 9,      // I
  AMOUNT: 10,   // J
  NR: 11,       // K
  STATUS: 12,   // L
  KEY: 27,      // AA 内部キー
  SYNCED: 28    // AB 最終同期
};

var TEMPLATE_ROW = 21;

// --- HTML 読込（差し替え可能） ---

function getScheduleDashboardHtml_() {
  var html = SCHEDULE_DASHBOARD_HTML;
  if (html && String(html).trim()) return String(html);
  var p = PropertiesService.getScriptProperties().getProperty('SCHEDULE_DASHBOARD_HTML');
  if (p) return p;
  throw new Error('SCHEDULE_DASHBOARD_HTML が空です。定数に貼るか Script Properties に SCHEDULE_DASHBOARD_HTML を設定してください。');
}

// --- DOM 相当: div 深さで day-section / card を抽出 ---

function extractFirstDivByClass_(html, className, fromIndex) {
  fromIndex = fromIndex || 0;
  var re = new RegExp('<div[^>]*\\b' + className + '\\b[^>]*>', 'i');
  var sub = html.substring(fromIndex);
  var m = re.exec(sub);
  if (!m) return null;
  var openTagStart = fromIndex + m.index;
  var start = openTagStart + m[0].length;
  var depth = 1;
  var i = start;
  while (depth > 0 && i < html.length) {
    var nextOpen = html.indexOf('<div', i);
    var nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return {
          inner: html.substring(start, nextClose),
          nextIndex: nextClose + 6,
          openTagStart: openTagStart
        };
      }
      i = nextClose + 6;
    }
  }
  return null;
}

function stripTags_(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTextOfFirstDivByClass_(block, className) {
  var r = extractFirstDivByClass_(block, className, 0);
  if (!r) return '';
  return stripTags_(r.inner);
}

/**
 * schedule-dashboard.html を解析し、予定オブジェクトの配列を返す。
 * 各カード: 日付(YYYY-MM-DD), 時間, タイトル, 電話, 金額raw, メモ
 */
function parseScheduleDashboardHtmlToEvents_(html) {
  var list = [];
  var cursor = 0;
  while (true) {
    var sec = extractFirstDivByClass_(html, 'day-section', cursor);
    if (!sec) break;
    cursor = sec.nextIndex;
    var inner = sec.inner;
    var dateHeaderText = extractTextOfFirstDivByClass_(inner, 'date-header');
    var dateYmd = parseDateHeaderToYmd_(dateHeaderText);
    var ic = 0;
    while (true) {
      var card = extractFirstDivByClass_(inner, 'card', ic);
      if (!card) break;
      ic = card.nextIndex;
      var cardHtml = card.inner;
      var h3m = cardHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      var title = h3m ? stripTags_(h3m[1]).trim() : '';
      var timeRaw = extractLabeledRow_(cardHtml, '時間');
      var phone = extractLabeledRow_(cardHtml, '電話番号');
      if (!phone) phone = extractLabeledRow_(cardHtml, '電話');
      var amountRaw = extractLabeledRow_(cardHtml, '金額');
      var memo = extractLabeledRow_(cardHtml, 'メモ');
      list.push({
        dateYmd: dateYmd,
        timeRaw: timeRaw,
        title: title,
        phone: phone,
        amountRaw: amountRaw,
        memo: memo
      });
    }
  }
  return list;
}

/**
 * カード内の「ラベル」行から値を取得（row / flex 等の簡易対応）
 */
function extractLabeledRow_(cardHtml, label) {
  if (!cardHtml || !label) return '';
  var esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var re = new RegExp(esc + '[\\s\\S]{0,400}?>([\\s\\S]*?)<', 'i');
  var m = cardHtml.match(re);
  if (!m) return '';
  var t = stripTags_(m[1]).trim();
  return t;
}

/**
 * 日付見出し（例: 2026年4月3日(金)）を YYYY-MM-DD に
 */
function parseDateHeaderToYmd_(text) {
  if (!text) return '';
  var m = String(text).match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!m) return '';
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  return pad2_(y) + '-' + pad2_(mo) + '-' + pad2_(d);
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

// --- タイトル解析・内部キー ---

function parseTitleFields_(title) {
  var src = requestSourceFromTitle_(title);
  var customer = extractCustomerNameFromTitle_(title);
  var work = extractWorkContent_(title);
  var nr = classifyNewOrRepeat_(title);
  return {
    requestSource: src,
    customerName: customer,
    workContent: work,
    newOrRepeat: nr
  };
}

function requestSourceFromTitle_(title) {
  if (!title) return '';
  var t = String(title);
  if (t.indexOf('くらし') !== -1) return 'くらし';
  if (t.indexOf('くらま') !== -1) return 'くらま';
  if (t.indexOf('コープ') !== -1) return 'コープ';
  if (t.indexOf('LP') !== -1) return 'LP';
  if (t.indexOf('110番') !== -1) return '110番';
  if (t.indexOf('直受') !== -1 || t.indexOf('直請け') !== -1) return '直請け';
  return '';
}

/**
 * 作業コード: R を含む → リピート / N のみ系 → 新規 / それ以外は空欄
 */
function classifyNewOrRepeat_(title) {
  if (!title) return '';
  var t = String(title);
  if (/[Nn]\d+[Rr]/.test(t)) return 'リピート';
  if (/\bR\d/i.test(t)) return 'リピート';
  if (/\bN\d+\b/.test(t)) return '新規';
  return '';
}

function extractCustomerNameFromTitle_(title) {
  if (!title) return '';
  var m = String(title).match(/\(([^)]+)\)/);
  if (!m) return '';
  var n = m[1].trim().replace(/[様さん]+$/g, '').trim();
  return n;
}

function extractWorkContent_(title) {
  if (!title) return '';
  return String(title).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function buildInternalKey_(dateYmd, timeHHmm, title) {
  var t = timeHHmm ? String(timeHHmm) : '';
  return String(dateYmd) + '|' + t + '|' + String(title);
}

/** 終日なら true */
function isAllDayTime_(timeRaw) {
  if (!timeRaw) return true;
  var s = String(timeRaw).trim();
  if (!s) return true;
  if (/終日|終日予定|all\s*day/i.test(s)) return true;
  return false;
}

/**
 * 表示時刻 → Spreadsheet が時刻として扱える Date（1970-01-01 基準の時刻）
 */
function parseTimeToSheetDate_(timeRaw) {
  if (!timeRaw || isAllDayTime_(timeRaw)) return '';
  var s = String(timeRaw).trim();
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  var h = parseInt(m[1], 10);
  var min = parseInt(m[2], 10);
  return new Date(1970, 0, 1, h, min, 0);
}

/** キー用 HH:mm */
function normalizeTimeForKey_(timeRaw) {
  if (!timeRaw || isAllDayTime_(timeRaw)) return '';
  var m = String(timeRaw).trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return pad2_(parseInt(m[1], 10)) + ':' + pad2_(parseInt(m[2], 10));
}

function parseAmountYen_(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  var t = String(raw).replace(/[,，\s円]/g, '');
  if (!t) return '';
  var n = parseInt(t, 10);
  return isNaN(n) ? '' : n;
}

function sheetDateFromYmd_(ymd) {
  if (!ymd) return '';
  var p = String(ymd).split('-');
  if (p.length !== 3) return '';
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

// --- 予定配列（HTML → 行データ） ---

function buildEventListFromHtml(html) {
  var raw = parseScheduleDashboardHtmlToEvents_(html);
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var e = raw[i];
    if (!e.title) continue;
    var fields = parseTitleFields_(e.title);
    var timeKey = normalizeTimeForKey_(e.timeRaw);
    var ikey = buildInternalKey_(e.dateYmd, timeKey, e.title);
    out.push({
      dateYmd: e.dateYmd,
      dateValue: sheetDateFromYmd_(e.dateYmd),
      timeValue: parseTimeToSheetDate_(e.timeRaw),
      isAllDay: isAllDayTime_(e.timeRaw),
      title: e.title,
      phone: e.phone ? String(e.phone) : '',
      amount: parseAmountYen_(e.amountRaw),
      memoForAddr: e.memo ? String(e.memo) : '',
      requestSource: fields.requestSource,
      customerName: fields.customerName,
      workContent: fields.workContent,
      newOrRepeat: fields.newOrRepeat,
      internalKey: ikey
    });
  }
  return out;
}

// --- シート操作 ---

function buildExistingKeyMap_(sheet) {
  var last = Math.max(sheet.getLastRow(), DATA_START_ROW);
  var keys = sheet.getRange(DATA_START_ROW, COL.KEY, last, COL.KEY).getValues();
  var map = {};
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i][0];
    if (k !== '' && k !== null && k !== undefined) {
      map[String(k)] = DATA_START_ROW + i;
    }
  }
  return map;
}

function findFirstEmptyDataRow_(sheet) {
  var max = Math.max(sheet.getLastRow(), DATA_START_ROW);
  var scanEnd = max + 200;
  for (var r = DATA_START_ROW; r <= scanEnd; r++) {
    var aa = sheet.getRange(r, COL.KEY).getValue();
    if (aa === '' || aa === null) return r;
  }
  return max + 1;
}

/**
 * 直上行から書式・入力規則を継承（値は上書き前に消さない。PASTE_FORMAT のみ）
 */
function prepareNewRow_(sheet, row) {
  var templateRow = row - 1;
  if (templateRow < TEMPLATE_ROW) templateRow = TEMPLATE_ROW;
  var lastCol = sheet.getMaxColumns();
  var src = sheet.getRange(templateRow, 1, templateRow, lastCol);
  var dst = sheet.getRange(row, 1, row, lastCol);
  src.copyTo(dst, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  try {
    src.copyTo(dst, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
  } catch (e) { /* ignore */ }
}

function writeEventToRow_(sheet, row, ev) {
  var now = new Date();
  sheet.getRange(row, COL.DATE).setValue(ev.dateValue);
  if (ev.isAllDay) {
    sheet.getRange(row, COL.TIME).clearContent();
  } else {
    sheet.getRange(row, COL.TIME).setValue(ev.timeValue);
  }
  sheet.getRange(row, COL.SOURCE).setValue(ev.requestSource);
  sheet.getRange(row, COL.CUSTOMER).setValue(ev.customerName);
  sheet.getRange(row, COL.PHONE).setValue(ev.phone);
  sheet.getRange(row, COL.ADDR).setValue(ev.memoForAddr);
  sheet.getRange(row, COL.WORK).setValue(ev.workContent);
  sheet.getRange(row, COL.AMOUNT).setValue(ev.amount === '' ? '' : ev.amount);
  sheet.getRange(row, COL.NR).setValue(ev.newOrRepeat);
  sheet.getRange(row, COL.STATUS).setValue('確定');
  sheet.getRange(row, COL.KEY).setValue(ev.internalKey);
  sheet.getRange(row, COL.SYNCED).setValue(now);
}

/**
 * メイン: HTML → 受付マスター（22行目以降のみ）
 */
function syncScheduleDashboardHtmlToReceptionMaster() {
  var html = getScheduleDashboardHtml_();
  var events = buildEventListFromHtml(html);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(RECEPTION_SHEET_NAME);
  if (!sheet) throw new Error('シートが見つかりません: ' + RECEPTION_SHEET_NAME);

  var keyMap = buildExistingKeyMap_(sheet);

  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var row = keyMap[ev.internalKey];
    if (row) {
      writeEventToRow_(sheet, row, ev);
    } else {
      var newRow = findFirstEmptyDataRow_(sheet);
      prepareNewRow_(sheet, newRow);
      writeEventToRow_(sheet, newRow, ev);
      keyMap[ev.internalKey] = newRow;
    }
  }

  if (typeof applyReceptionRowColors_ === 'function') {
    try {
      applyReceptionRowColors_();
    } catch (e) {
      Logger.log('applyReceptionRowColors_: ' + e);
    }
  }
}

// --- テスト用（任意） ---

function testParseScheduleDashboardHtml() {
  var html = getScheduleDashboardHtml_();
  var evs = buildEventListFromHtml(html);
  Logger.log(JSON.stringify(evs, null, 2));
}

// --- 公開名（他ファイル・トリガーから呼びやすい薄ラッパー） ---

function parseScheduleDashboardHtmlString(html) {
  return parseScheduleDashboardHtmlToEvents_(html);
}

function parseTitleFields(title) {
  return parseTitleFields_(title);
}

function buildInternalKey(dateYmd, timeHHmm, title) {
  return buildInternalKey_(dateYmd, timeHHmm, title);
}

function buildExistingKeyMap(sheet) {
  return buildExistingKeyMap_(sheet);
}

function prepareNewRow(sheet, row) {
  prepareNewRow_(sheet, row);
}

/**
 * 既存: GoogleカレンダーAPI 同期は削除しない方針。
 * 実運用の主入口は syncScheduleDashboardHtmlToReceptionMaster を使用。
 * （既存のカレンダー同期関数は別ファイルに残している場合、そのまま併存可能。）
 */
