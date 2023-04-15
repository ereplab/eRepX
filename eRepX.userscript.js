// ==UserScript==
// @name             eRepX
// @version          0.0.1
// @description      An attempt to add helpful extensions to our game
// @author           driversti
// @updateURL
// @downloadURL
// @run-at           document-end
// @match            https://www.erepublik.com/*
// @grant            GM_addStyle
// @grant            GM_getResourceURL
// @grant            GM_getResourceText
// ==/UserScript==

(function () {
  'use strict';

  // Define styles
  var styles = {
    clickable: 'cursor: pointer; margin-left: 5px;'
  };

  var moneyEmoji, ticketEmoji;

// Define a function to be called whenever the travelPopup div is shown
  function addEmojis() {
    // Find the target element
    var targetElement = document.querySelector(targetElementSelector);
    if (targetElement) {
      console.log("Target element found");
      // Create the money and ticket emoji elements
      moneyEmoji = createEmojiElement('MONEY', function (event) {
        handleClick(event, 'on');
      });
      ticketEmoji = createEmojiElement('TICKETS', function (event) {
        handleClick(event, 'off');
      });

      // Add the emojis as the last children of the target element
      targetElement.appendChild(document.createTextNode("Click to use: "));
      targetElement.appendChild(moneyEmoji);
      targetElement.appendChild(ticketEmoji);
    } else {
      console.log("Target element not found");
    }
  }

  // Create a clickable emoji element
  function createEmojiElement(text, eventHandler) {
    var emoji = document.createElement('span');
    emoji.innerHTML = text;
    emoji.style = styles.clickable;
    emoji.addEventListener('click', eventHandler);
    return emoji;
  }

  // Define a function to be called whenever the ticket or money emoji is clicked

  function handleClick(event, optionValue) {
    // Find the CSRF token and auth token
    var csrfToken = SERVER_DATA.csrfToken;
    var authToken = erepublik.settings.pomelo.authToken;

    // Define the request URL and headers
    var url = 'https://www.erepublik.com/en/main/profile-update';
    var headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': 'erpk=' + authToken,
      'referer': document.referrer,
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': navigator.userAgent
    };

    // Define the request data
    var data = {
      action: 'options',
      params: {
        optionName: 'travel_use_currency',
        optionValue: optionValue
      },
      _token: csrfToken
    };

    const travelOption = optionValue === 'on' ? 'currency' : 'tickets';
    // Send the request using fetch()
    fetch(url, {
      method: 'POST',
      headers: headers,
      body: new URLSearchParams(data),
    }).then(function (response) {
      if (response.ok) {
        updateSelectedEmojiStyles(optionValue)
        console.log('Travel with ' + travelOption + ' enabled');
      } else {
        console.log('Cannot switch ' + travelOption + ' on');
      }
    }).catch(function (e) {
      console.log('Cannot switch ' + travelOption + ' on. Cause: ' + e.message);
    });
  }

  function updateSelectedEmojiStyles(selectedOption) {
    applySelectedStyle(moneyEmoji, selectedOption === 'on');
    applySelectedStyle(ticketEmoji, selectedOption === 'off');
  }

  function applySelectedStyle(element, isSelected) {
    const fontWeight = isSelected ? 'bold' : 'normal';
    const fontSize = isSelected ? '1.5em' : '1em';
    element.style.cssText += `font-weight: ${fontWeight}; font-size: ${fontSize};`;
  }

  // Use a MutationObserver to watch for changes to the DOM
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // Check if a new travelPopup div or battleSetupPopupWrapper has been added to the DOM
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          var node = mutation.addedNodes[i];

          if (node.id === 'travelPopup') {
            addEmojis('#travel_location_options');
            break;
          }

          if (node.classList && node.classList.contains(
                  'battleSetupPopupWrapper') &&
              node.classList.contains('opened') &&
              node.style.visibility === 'visible') {
            var divisionsDiv = document.querySelector('#divisions');
            if (divisionsDiv) {
              addEmojis(divisionsDiv.parentElement);
            }
            break;
          }
        }
      }
    });
  });

  // Start the MutationObserver
  observer.observe(document.body, {childList: true, subtree: true});

})();
