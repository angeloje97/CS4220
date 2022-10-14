const fileName = "./bankdata.json"
let bankData = require(fileName);
const fs = require("fs");

const currentTimeStamp = () => {
    const current = new Date();


    const abrev = current.getHours() < 12 ? "AM" : "PM";

    const month = parseInt(current.getMonth()) + 1;

    const time = `${formatNumber(current.getHours()%12)}:${formatNumber(current.getMinutes())} ${abrev}`;
    const date = `${formatNumber(month)}-${formatNumber(current.getDate())}-${formatNumber(current.getFullYear())} `;

    return date.concat(time);
}

const formatNumber = (num) => {
    return ("0" + num).slice(-2);
}

const currentBalance = () => {
    return bankData.currentBalance;
}

const canPurchase = (price) => {
    return bankData.currentBalance >= price;
}

const resetBank = () => {
    fs.writeFile(fileName, JSON.stringify(require("./bankdata-template.json")), (error) => {

        if (error) {
            console.log("There was an error");
        }
    })
}

const addHistory = (amount, message, type) => {
    if (!amount) {
        amount = 0;
    }
    const transaction = {
        amount,
        message,
        date: currentTimeStamp(),
        type
    }

    bankData.transactionHistory = [...bankData.transactionHistory, transaction];

    fs.writeFile(fileName, JSON.stringify(bankData), (error) => {
        if (error) {
            console.log("There was an error");
        }
    });
}

const clearHistory = () => {
    bankData.transactionHistory = [];

    fs.writeFile(fileName, JSON.stringify(bankData), (error) => {
        if (error) {
            console.log("There was an error");

        }
    })
}

const deposite = (amount, message = "Bank Deposite", type = "deposite") => {
    if (amount < 0) {
        amount = -amount;
    }

    bankData.currentBalance += amount;
    addHistory(amount, message, type);
}

const withdrawal = (amount, addToHistory = true, message = "Bank Withdrawal", type = "withdrawal") => {
    if (bankData.currentBalance < amount) return;

    bankData.currentBalance -= amount;
    if (addToHistory) {
        addHistory(-amount, message, type);
    }
}

const data = () => {
    return bankData;
}

const loadData = (newBank) => {

    if (newBank) {
        bankData = newBank;

    }
}

module.exports = {
    addHistory,
    clearHistory,
    loadData,
    data,
    deposite,
    withdrawal,
    canPurchase,
    currentBalance,
    resetBank,
}