function testWpHealth() {
  const runId = 'TEST-' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmmss');
  return wpGet_(HT.ENDPOINTS.HEALTH, runId);
}

function installDailyTriggers() {
  removeProjectTriggers_();

  ScriptApp.newTrigger('runCommandCenterPush')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(10)
    .create();

  ScriptApp.newTrigger('runCommandCenterPush')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .nearMinute(0)
    .create();
}

function removeProjectTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
}