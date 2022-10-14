const tvMaze = require("tvmaze-api");
const inquirer = require("inquirer");
const wallet = require("mock-bank");
const { choices, showHelpOnFail } = require("yargs");

const shoppingCart = {
  items: [],
  totalCost: 0,
};

const pausePrompt = (message = "") => {
  return inquirer.prompt({
    type: "confirm",
    name: "userSelected",
    message,
  });
};

const updateShoppingCartPrice = () => {
  let total = 0;

  shoppingCart.items.forEach((item) => {
    const price = calculatePrice(item);

    total += parseInt(price);
  });

  shoppingCart.totalCost = total;
};

const _addToCart = async (input) => {
  const price = calculatePrice(input.showData);

  const priceSum = parseInt(price) + parseInt(shoppingCart.totalCost);

  if (priceSum >= wallet.currentBalance()) {
    await pausePrompt(
      "Not enough funds (Press enter to go back to show options"
    );
  } else {
    shoppingCart.items.push(input.showData);
    updateShoppingCartPrice();
    await pausePrompt("Successfuly added to shopping cart");
  }
};

const _removeFromCart = async (input) => {
  shoppingCart.items = shoppingCart.items.filter((show) => {
    if (show.id !== input.showData.id) {
      return show;
    }
  });

  updateShoppingCartPrice();

  await pausePrompt("Successfully removed show");
};

const _clearCart = async () => {
  const length = shoppingCart.items.length;

  if (length === 0) {
    await pausePrompt("Nothing To Remove");
  } else {
    shoppingCart.items = [];
    updateShoppingCartPrice();
    await pausePrompt(`Removed ${length} items`);
  }
};

const printBreak = () => {
  console.log(
    "-----------------------------------------------------------------------"
  );
};

const containsShow = (showCheck) => {
  for (const show of shoppingCart.items) {
    if (showCheck.id === show.id) {
      return true;
    }
  }

  return false;
};

const _handleShowDetails = async (input) => {
  const show = input.showData;

  const body = {
    type: "list",
    name: "userSelected",
    Message: `Details for ${show.name}`,
    choices: [],
  };

  body.choices = [
    new inquirer.Separator(),
    {
      name: "Back",
      value: "back",
    },
    new inquirer.Separator(),
  ];

  const showDetails = [
    {
      name: "Show Summary",
      value: show.summary,
    },
    {
      name: "Genres",
      value: show.genres,
    },
    {
      name: "Premiere Date",
      value: show.premiered,
    },
    {
      name: "End Date",
      value: show.ended,
    },
    {
      name: "Website URL",
      value: show.officialSite,
    },
    {
      name: "Schedule",
      value: show.schedule,
    },
    {
      name: "Rating",
      value: show.rating,
    },
  ];

  body.choices = body.choices.concat(showDetails);

  while (input.type !== "back") {
    const result = await inquirer.prompt(body);

    if (result.userSelected != "back") {
      if (result.userSelected) {
        console.log(result.userSelected);
        await pausePrompt("Press Enter to continue");
      } else {
        await pausePrompt("Not available | Press Enter to Continue");
      }
    } else {
      break;
    }
  }

  input.type = "show";
};

const _handleShow = async (input) => {
  const show = input.showData;

  const body = {
    type: "list",
    name: "userSelected",
    message: `Options for ${show.name} $${calculatePrice(
      show
    )} | Wallet: $${wallet.currentBalance()}`,
    choices: [],
  };

  while (input.type !== "return") {
    const cartOption = containsShow(show)
      ? {
          name: "Remove from Cart",
          value: "removeFromCart",
        }
      : {
          name: "Add to Cart",
          value: "addToCart",
        };

    body.choices = [
      cartOption,
      {
        name: "Back",
        value: "return",
      },
      {
        name: "Return To Menu",
        value: null,
      },
      {
        name: "Seasons",
        value: "seasons",
      },
      {
        name: "Show Details",
        value: "details",
      },
    ];

    const results = await inquirer.prompt(body);

    input.type = results.userSelected;

    switch (input.type) {
      case "addToCart":
        await _addToCart(input);
        break;
      case "removeFromCart":
        await _removeFromCart(input);
        break;
      case "seasons":
        await _handleSeason(input);
        break;
      case "details":
        await _handleShowDetails(input);
        break;
    }

    if (input.type === null) {
      break;
    }
  }

  if (input.type === "return") {
    input.type = input.previousType;
  }

  return input;
};

const calculatePrice = (show) => {
  const rating = show.rating.average;

  let price = 1;

  if (rating) {
    price *= parseInt(rating) * 3;
  } else {
    price = 10;
  }

  if (show.ended) {
    const yearEnded = parseInt(show.ended.slice(0, 4));
    const yearsPast = parseInt(new Date().getFullYear()) - yearEnded;

    if (yearsPast !== 0) {
      price /= yearsPast * 0.25;
    }
  }

  return price.toFixed(2);
};

const _showSearchResults = async (input) => {
  input.previousType = input.type;

  const items = input.showListData;

  const body = {
    type: "list",
    name: "userSelected",
    message: `(${items.length}) Results | Select Option`,
    choices: [],
  };

  body.choices = [
    new inquirer.Separator(),
    {
      name: "Search Again",
      value: "search",
    },
    {
      name: "Return to Menu",
      value: null,
    },
    new inquirer.Separator(),
  ];

  body.choices = body.choices.concat(
    items.map((item) => {
      const price = calculatePrice(item.show);
      return {
        name: `${item.show.name} $${price}`,
        value: item.show.id,
      };
    })
  );

  const results = await inquirer.prompt(body);

  if (typeof results.userSelected === "number") {
    input.type = "show";
    input.showID = results.userSelected;
    input.showData = await tvMaze.show(input.showID);
  } else {
    input.type = results.userSelected;
  }

  return input;
};

const _handleSeason = async (input) => {
  const seasons = await tvMaze.seasons(input.showData.id);
  const body = {
    type: "list",
    name: "userSelected",
    message: ` ${input.showData.name} | Seasons | Pick Action`,
    choices: [],
  };

  body.choices = [
    new inquirer.Separator(),
    {
      name: "Return",
      value: "return",
    },
    new inquirer.Separator(),
  ];

  const seasonChoices = seasons.map((season, index) => {
    return {
      name: `Season ${index + 1} | Episodes: ${season.episodeOrder}`,
      value: season.id,
    };
  });

  body.choices = body.choices.concat(seasonChoices);

  while (input.type !== "return") {
    printBreak();
    const results = await inquirer.prompt(body);

    if (typeof results.userSelected === "number") {
      input.seasonID = results.userSelected;

      input.seasonData = seasons.filter((season) => {
        if (season.id === results.userSelected) {
          return season;
        }
      })[0];

      await _handleEpisode(input);
    } else {
      input.type = results.userSelected;
    }
  }

  input.type = "show";
};

const _handleEpisode = async (input) => {
  const episodes = await tvMaze.episodesBySeasons(input.seasonID);
  const body = {
    type: "list",
    name: "userSelected",
    message: `Season Episodes | Select Episode to Display Details`,
    choices: [],
  };

  body.choices = [
    new inquirer.Separator(),
    {
      name: "Return",
      value: "return",
    },
    {
      name: "Season Summary",
      value: "summary",
    },
    new inquirer.Separator(),
  ];

  const episodeChoices = episodes.map((episode, index) => {
    return {
      name: `Episode ${index + 1} | ${episode.name}`,
      value: episode.id,
    };
  });

  body.choices = body.choices.concat(episodeChoices);

  while (input.type !== "return") {
    printBreak();
    const results = await inquirer.prompt(body);

    if (typeof results.userSelected === "number") {
      const episode = episodes.filter((episode) => {
        if (episode.id === results.userSelected) {
          return episode;
        }
      })[0];

      const info = {
        airDate: episode.airdate,
        runTime: episode.runtime,
        rating: episode.rating,
      };

      if (episode.summary) {
        info.summary = episode.summary.slice(3, episode.summary.length - 4);
        info.summary = info.summary.replaceAll("<p>", "");

        console.log(`Summary: ${info.summary}`);
      }

      console.log(`Air Date: ${info.airDate}`);
      console.log(`Run Time: ${info.runTime} minutes`);

      if (info.rating.average) {
        console.log(`Rating: ${info.rating.average}`);
      }

      await pausePrompt("Press Enter to Continue");
    } else if (results.userSelected === "summary") {
      if (input.seasonData.summary) {
        const info = {
          summary: input.seasonData.summary.slice(
            3,
            input.seasonData.summary.length - 4
          ),
          premiereDate: input.seasonData.premiereDate,
          network: input.seasonData.network.name,
        };
        console.log("Summary:", info.summary);
        console.log("Premiere Date", info.premiereDate);
        console.log("Network:", info.network);
        await pausePrompt("Press Enter to continue");
      } else {
        await pausePrompt("There is no summary");
      }
    } else {
      input.type = results.userSelected;
    }
  }

  input.type = "seasons";
};

const _handleSearch = async (input) => {
  const body = {
    type: "input",
    name: "searchQuery",
    message: "Search for: ",
  };

  const results = await inquirer.prompt(body);

  input.type = "showSearchResults";
  input.searchQuery = results.searchQuery;

  input.showListData = await tvMaze.shows(results.searchQuery);

  return input;
};

const _promptDefault = async (input) => {
  const body = {
    type: "list",
    name: "userSelected",
    message: `Select Action | Wallet: $${wallet.currentBalance()}`,
    choices: [],
  };

  body.choices = [
    {
      name: "Search TV Shows",
      value: "search",
    },
    {
      name: `Shopping Cart (${shoppingCart.items.length})`,
      value: "shoppingCart",
    },
    {
      name: "Exit",
      value: "exit",
    },
  ];

  const results = await inquirer.prompt(body);

  input.type = results.userSelected;
  return input;
};

const _showShoppingCartItems = async (input) => {
  input.previousType = input.type;

  const body = {
    type: "list",
    name: "userSelected",
    message: "",
    choices: [],
  };

  body.choices = [
    {
      name: "Return to shopping cart",
      value: "return",
    },
    {
      name: "Clear Shopping Cart",
      value: "shoppingCartClear",
    },
    new inquirer.Separator(),
  ];

  body.message = `Choose Shopping Cart Action | Total Shopping Cart Cost $${shoppingCart.totalCost}`;
  const tvShows = shoppingCart.items.map((show) => {
    return {
      name: `Show: ${show.name} | ID : ${show.id} | Price: $${calculatePrice(
        show
      )}`,
      value: show.id,
    };
  });

  body.choices = body.choices.concat(tvShows);

  const results = await inquirer.prompt(body);

  if (typeof results.userSelected === "number") {
    input.showId = results.userSelected;
    input.showData = shoppingCart.items.filter((show) => {
      if (show.id === input.showId) {
        return show;
      }
    })[0];

    input.type = "show";
  } else if (results.userSelected === "return") {
    input.type = "shoppingCart";
  } else if (results.userSelected === "shoppingCartClear") {
    await _clearCart();
    input.type = "showShoppingCartItems";
  }

  return input;
};

const _shoppingCart = async (input) => {
  input.previousType = input.type;
  const body = {
    type: "list",
    name: "userSelected",
    message: `Shopping Cart Actions | Total Cart Cost ($${
      shoppingCart.totalCost
    }) | Wallet ($${wallet.currentBalance()})`,
    choices: [
      {
        name: "Confirm Purchase",
        value: "purchase",
      },
      {
        name: "Return",
        value: null,
      },
      {
        name: `Show Items (${shoppingCart.items.length})`,
        value: "showShoppingCartItems",
      },
    ],
  };

  const results = await inquirer.prompt(body);

  if (results.userSelected === "purchase" && shoppingCart.items.length > 0) {
    wallet.withdrawal(
      shoppingCart.totalCost,
      true,
      `Bought ${shoppingCart.items.length} tv show(s)`
    );
    shoppingCart.items = [];
    results.userSelected = null;
  }

  input.type = results.userSelected;
  return input;
};

const initializeWithSearch = async (searchString) => {
  try {
    let input = {
      type: "showSearchResults",
      searchQuery: searchString,
    };

    input.showListData = await tvMaze.shows(searchString);

    wallet.loadData(require("./bankdata.json"));

    while (input.type !== "exit") {
      printBreak();

      switch (input.type) {
        case "search":
          input = await _handleSearch(input);
          break;
        case "showSearchResults":
          input = await _showSearchResults(input);
          break;
        case "show":
          input = await _handleShow(input);
          break;
        case "shoppingCart":
          input = await _shoppingCart(input);
          break;
        case "showShoppingCartItems":
          input = await _showShoppingCartItems(input);
          break;
        default:
          input = await _promptDefault(input);
          break;
      }

      printBreak();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  initializeWithSearch,
};
