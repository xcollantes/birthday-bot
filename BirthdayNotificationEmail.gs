/**
 * @fileoverview Auto-notification system for Birthday
 * @author Xavier Collantes (xcollantes@google.com)
 */

const SHEET_ID = "";
const BDAY_SHEET = SpreadsheetApp.openById(SHEET_ID);

// Two emails will be sent:
// 1. 7 days before
// 2. 1 day before
const FIRST_NOTIFY = 7;
const SECOND_NOTIFY = 1;

// Email list override 
const TEST_SEND_TO = "xcollantes@google.com";
const SUBJECT = "TEST: B-Day Bot: Bday Notification!" // TEST

/**
 * Main
 */
function findParty(){
  let x = getContent();
  console.log(x);
  findDateWithinThisWeek(x);
}

/**
 * Send notification email.
 * @param {string} recipients Separated by commas.
 * @param {string} body Email body section. 
 */
function sendNotifyEmail(body, recipients) {
  var file = DriveApp.getFileById(SHEET_ID);

  MailApp.sendEmail(TEST_SEND_TO, SUBJECT, body, file); // TEST
  console.log("SENT EMAIL to: " + recipients);
}

/**
 * Since year is not set in sheet, default value is current year.
 * If the date is past today, then set to next year. 
 * @param {Date} Birthdate or Googleversary.
 * @returns Date with correct year.
 */
function setYearThisOrNext(date) {
  let currentYear = new Date().getFullYear();
  console.log("setYearThis: " + date);

  if (isPastThisCalendarYear(date)) {
    date.setFullYear(currentYear + 1);
  } else {
    date.setFullYear(currentYear);
  }
  console.log("Determine next party: setYearThis: " + date);
  
  return date;
}

/**
 * Find the difference in milliseconds between given date 
 * and now.  
 * @param {Date} date is given date.
 * @returns Difference in days. 
 */
function diffDateInDaysFromNow(date) {
  var diffInMilliSec = date - new Date(); // If positive, then date in future 

  // 86400 is seconds in a 24 hour period 
  return (Math.abs(diffInMilliSec) / 1000) / 86400;
}

/**
 * @param {Date} date 
 * @returns Return true if given date object is before today in 
 *    a calendar year. 
 */
function isPastThisCalendarYear(date) {
  let tempDate = new Date();

  tempDate.setDate(date.getDate());
  tempDate.setMonth(date.getMonth());

  return tempDate < new Date();
}

/**
 * Gather data from sheet with each row as a list.
 * @returns Each row is a list and the whole set is a list of 
 *    those lists.
 */
function getContent() {
  Logger.log("Getting data from sheet: " + BDAY_SHEET.getSheetName());

  let numRows = 0;
  let currentRow = 2;

  while (BDAY_SHEET.getRange("A" + currentRow).getValue() != "") {
    numRows++;
    currentRow++;
  }

  let numCols = 4;
  Logger.log("Found rows: " + numRows + "; columns: " + numCols);

  let sheetData = BDAY_SHEET.getSheetValues(2, 1, numRows, numCols);
  
  return sheetData;
}


/**
 * For each row, find the birthdate and determine if near.
 * @param {List[]} dataRows Date object for the birthday. 
 */
function findDateWithinThisWeek(dataRows) {
  let emailTo = "";

  // Nested lists: [name, days until, date]
  let bdayList = [];

  dataRows.forEach(function (row) {
    console.log("Applying to: " + row);
    let emailExempt = false;
    
    setYearThisOrNext(row[2]) // Position 2 is bday 

    let bdayDays = diffDateInDaysFromNow(new Date(row[2])).toPrecision(1);
    
    if (bdayDays == FIRST_NOTIFY || bdayDays == SECOND_NOTIFY) {
      let bday = new Date(row[2]);
      let bdayFormatted = bday.toString().split(" ").slice(0, 4).join(" ");

      bdayList.push([row[0], bdayDays, bdayFormatted]);
      emailExempt = true;
    }

    if (!emailExempt) {
      emailTo = emailTo + row[1] + "@google.com,";
    }


  });

  console.log("*** LISTS ***\n" + "bday: " + bdayList);
  let body = "" +
  "Hello there, \n\n\n" +
  "You have crewmmates with birthdays coming up!\n\n";

  if (bdayList.length) {
    body += "Upcoming Birthdays: \n";
    for (let person of bdayList) {
      let days = person[1] <= 1 ? " day" : " days";
      body += person[0] + " in " + person[1] + days + " on " + person[2] + "\n";
    }
  }

  let testEmailList = "\n\n\n\n\n\n***TEST SECTION: " + 
                      "You will not see this section in prod***\n\n" +
                      "Email sent to: \n\n" + emailTo  + "\n\n***END TEST SECTION***"; // TEST
  body += testEmailList;  // TEST

  body += "\n\n\nSHHH!!1 Everyone on the team got this message except " + 
          "the ones on the list...\n\n\n\n\n\n\n\n\nThis is an automated message from the B-Day Bot, " +
          "to unsubscribe remove your LDAP from ";
  
  if (bdayList.length) {
    sendNotifyEmail(body, emailTo);
    console.log(body);
  } else {
    console.log("NO PARTIES FOUND, NO EMAIL SENT OUT.");
  }
}

