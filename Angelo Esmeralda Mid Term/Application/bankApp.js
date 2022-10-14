const bank = require("mock-bank");
const inquirer = require("inquirer");



const _pausePrompt = async (message) => {
    return inquirer.prompt({
        type: "confirm",
        name: "userContinue",
        message
    })
}

const _userInput = async (message = "") => {

    const body = {
        type: "input",
        name: "userInput",
        message
    }

    return inquirer.prompt(body);
}

const _deposite = async (input) => {
    const results = await _userInput("Enter amount to deposite");

    const resultNumber = parseInt(results.userInput);



    if (resultNumber) {
        bank.deposite(resultNumber);
        await _pausePrompt(`Depsoite Successful, New Balance: $${bank.currentBalance()} | Press Enter to Continue`);
    }


    input.type = null;
    return input;

}

const _withdrawal = async (input) => {

    const results = await _userInput("Enter amount to withdrawal");

    const resultNumber = parseInt(results.userInput);

    if (bank.currentBalance() >= resultNumber) {
        bank.withdrawal(resultNumber);
        await _pausePrompt(`Withdraw successful | New Balance $${bank.currentBalance()} Press enter to continue`);
    } else {
        await _pausePrompt("Please enter appropriate funds");
        return await _withdrawal(input);
    }

    input.type = null;
    return input;
}

const _resetBank = async (input) => {
    bank.withdrawal(bank.currentBalance(), false);
    bank.clearHistory();
    bank.resetBank();



    await _pausePrompt("Bank has been reset");

    input.type = null;
    return input;
}

const _printBank = async (input) => {
    console.log(bank.data());
    await _pausePrompt("Press Enter to Continue");

    input.type = null;
    return input;
}

const _defaultPrompt = async (input) => {

    const body = {
        type: "list",
        name: "userSelected",
        message: `Pick Action | Current Balance $${bank.currentBalance()}`,
        choices: [{
                name: "Print Bank",
                value: "print"
            }, {
                name: "Reset Bank",
                value: "reset"
            },
            {
                name: "Deposite",
                value: "deposite"
            }, {
                name: "Withdraw",
                value: "withdraw"
            }, {
                name: "Exit",
                value: "exit"
            },

        ]
    }

    const results = await inquirer.prompt(body);

    input.type = results.userSelected;

    return input;
}

const initialize = async (args) => {
    try {
        let input = {
            type: args
        }
        bank.loadData(require("./bankdata.json"));

        while (input.type !== "exit") {
            switch (input.type) {
                case "withdraw":
                    input = await _withdrawal(input);
                    break;
                case "deposite":
                    input = await _deposite(input);
                    break;
                case "reset":
                    input = await _resetBank(input);
                    break;
                case "print":
                    input = await _printBank(input);
                    break;
                default:
                    input = await _defaultPrompt(input);
                    break;
            }
        }
    } catch (error) {}
}

const quickAction = async (args, amount) => {
    const input = {
        type: args,
        amount
    }



    bank.loadData(require("./bankdata.json"));

    if (input.type === "withdraw") {
        if (bank.currentBalance() >= input.amount) {
            bank.withdrawal(input.amount);
            await _pausePrompt(`Successfully withdrawaled $${input.amount} from bank | New Balance is $${bank.currentBalance()} Press Enter to Continue`);
        } else {
            await _pausePrompt(`Please enter an appropriate amount of funds | Current balance $${bank.currentBalance()}`);
        }
    } else if (input.type === "deposite") {
        if (input.amount < 0) {
            input.amount = -input.amount;
        }
        bank.deposite(input.amount);
        await _pausePrompt(`Successfuly deposited $${input.amount} in bank account. New Balance is $${bank.currentBalance()} | Press Enter to Continue`);
    } else {
        await _pausePrompt("You can only use actions (withdraw/deposite) when using the amount option");
    }
}

module.exports = {
    quickAction,
    initialize
};