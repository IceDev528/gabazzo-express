function autocomplete(inp, cb) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", async function (e) {
    let query = inp.value.toLowerCase();
    let results = await cb(query);

    var a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");

    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    results.keys.forEach((key, index) => {
      let suggestions = results[key];
      if (!suggestions.length) return;
      let url = results["url"][index];
      suggestions.forEach((suggestion) => {
        b = document.createElement("DIV");
        let link = document.createElement("a");

        if (url === "category")
          link.href = `/search/?category=${suggestion.title}&Service+Type=${suggestion.value}`;
        else if (url === "services")
          link.href = `/search/?category=${suggestion.value}`;
        else link.href = `/${url}/${suggestion.searchKey}`;

        let li = document.createElement("li");
        li.innerText = suggestion.value;
        link.appendChild(li);
        b.appendChild(link);
        a.appendChild(b);
      });
    });
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      // e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

const fetchCompanyNames = (query) => {
  return fetch(`/api/search?query=${query}`).then((response) =>
    response.json()
  );
};

let cb = async (query) => {
  let isValid = /^[a-zA-Z]+$/.test(query);

  if (isValid) {
    let res = await fetchCompanyNames(query);
    return {
      companySuggestions: res.companySuggestions,
      serviceSuggestions: res.serviceSuggestions,
      categorySuggestions: res.categorySuggestions,
      keys: ["serviceSuggestions", "companySuggestions", "categorySuggestions"],
      titles: ["Services", "Companies", "Categories"],
      url: ["services", "company-profile", "category"],
    };
  }
};

/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
let nodes = document.querySelectorAll('input[type="search"]')
nodes.forEach((node) => autocomplete(node, cb));
autocomplete(document.getElementById("myInput2"), cb);
