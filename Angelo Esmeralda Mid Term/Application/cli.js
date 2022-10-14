const wallet = require("mock-bank");
const yargs = require("yargs");
const app = require("./app");
const bankApp = require("./bankApp");

yargs(process.argv.slice(2))
    .usage("$0: Usage <cmd> [options]")
    .command(
        "search <showName>",
        "search for a show",
        (yargs) => {
            return yargs
                .positional("showName", {
                    describe: "name of the show the user is trying to search up.",
                    type: "string"
                })
        },
        (args) => {
            if (args.showName) {
                app.initializeWithSearch(args.showName);
            }
        }
    )
    .command(
        "bank <action>",
        "let's user interact with the bank simulation",
        (yargs) => {
            return yargs
                .positional(
                    "action", {
                        describe: "Interaction type with the bank",
                        choices: ["withdraw", "deposite", "print"],
                        type: "string"
                    })
                .option("amount", {
                    alias: "amount",
                    describe: "Amount of money to deposite or withdrawal.",
                    type: "number"
                });
        },
        (args) => {
            if (args.amount) {
                bankApp.quickAction(args.action, args.amount);
            } else {
                bankApp.initialize(args.action);

            }
        }
    )
    .help().argv;