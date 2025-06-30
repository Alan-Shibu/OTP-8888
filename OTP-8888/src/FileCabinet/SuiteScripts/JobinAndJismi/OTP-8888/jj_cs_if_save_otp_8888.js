/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*************************************************************************************
 *
 * ${OTP-8888} : ${Restrict IF Save}
 *
 *
 **************************************************************************************
 *
 * Author: Jobin and Jismi IT Services
 *
 * Date Created : 29-June-2025
 *
 * Description : This script is designed for restricting 'Save' button on item 
 * fulfillment page , if the sum of all customer deposits , linked to the sales order 
 * from which the item fulfillment is to be done , is less than the total amount of the 
 * sales order.
 *
 * REVISION HISTORY
 *
 * @version 1.0  : 29-June-2025 :  The initial build was created by JJ0400
 *
 *
 *************************************************************************************/
define(["N/log", "N/record", "N/search"], /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
function (log, record, search) {
  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {
    try {
      let orderStatus = depositCheck(scriptContext.currentRecord);

      if (orderStatus) {
        return true;
      }
    } catch (e) {
      console.log("Error caught", e.message);
    }
  }


/** 
* Function to show check whether the total linked deposit sum is enough to
* clear the invoice 
* @param {Object} newRecord 
* @returns {boolean} 
*/ 
  function depositCheck(newRecord) {
    try {
      let depositAmount = 0;
      let salesOrderId = newRecord.getValue("createdfrom");
      let deposit;
      let statusArray = search.lookupFields({
        type: record.Type.SALES_ORDER,
        id: salesOrderId,
        columns: ["status", "applyingtransaction", "fxamount"],
      });

      let orderStatus = statusArray.status[0].text;
      if ((orderStatus = "Pending Fulfillment")) {

        if (statusArray.applyingtransaction.length === 0) {
          alert("No linked deposit found!");
        } else {
          let depositSearch = search.create({
            title: "Customer Deposit Search JJ",
            id: "customsearch_jj_customer_deposit",
            type: search.Type.TRANSACTION,
            filters: [
              ["type", "anyof", "CustDep"],
              "AND",
              ["mainline", "is", "T"],
              "AND",
              ["salesorder", "anyof", salesOrderId],
            ],
            columns: [
              search.createColumn({
                name: "fxamount",
                label: "Amount (Foreign Currency)",
              }),
            ],
          });

          depositSearch.run().each(function (result) {
            deposit = Number(result.getValue({ name: "fxamount" }));
            depositAmount += deposit;
            return true;
          });
        }

        if (depositAmount >= statusArray.fxamount) {
          return true;
        } else {
          alert(
            "The total deposit amount is not enough to clear the invoice !"
          );
        }

        return false;
      }
    } catch (e) {
      console.log("Error caught", e.message);
    }
  }

  return {
    saveRecord: saveRecord,
  };
});
