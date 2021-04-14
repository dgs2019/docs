import algoliasearch from "https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js";

const client = algoliasearch("BQ93464WAA", "8c5d4d4e0f5b07555c1188b7da8089e1");
const searchIndex = client.initIndex("docs");

export default async () => {
  const searchBox = document.getElementById("search");
  const searchForm = document.getElementById("search-form");
  searchBox.addEventListener("input", runSearch.debounce(250));
  searchForm.addEventListener("submit", (e) => e.preventDefault());
};

const runSearch = async (event) => {
  const searchResultsContainer = document.getElementById("search-results");
  searchResultsContainer.textContent = "";
  const searchTerm = event.target.value;
  if (searchTerm.length < 2) return;

  const { hits: results } = await searchIndex.search(searchTerm, {
    hitsPerPage: 10,
    attributesToRetrieve: ["title", "url"],
    attributesToSnippet: ["content"],
    snippetEllipsisText: "…",
  });

  const formattedResults = results.map((result) => {
    if (result.url) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const excerpt = document.createElement("p");
      link.href = result.url;
      link.classList.add(
        "db",
        "link",
        "eggplant",
        "hover-dragonfruit",
        "hover-bg-snow-light",
        "pv3",
        "ph4"
      );

      excerpt.classList.add("search-snippet");
      excerpt.innerHTML = result._snippetResult.content.value;
      title.innerText = result.title;
      link.appendChild(title);
      link.appendChild(excerpt);
      li.appendChild(link);
      return li;
    }
  });
  formattedResults.map((el) =>
    searchResultsContainer.insertAdjacentElement("beforeend", el)
  );
};

Function.prototype.debounce = function (delay) {
  var outter = this,
    timer;

  return function () {
    var inner = this,
      args = [].slice.apply(arguments);

    clearTimeout(timer);
    timer = setTimeout(function () {
      outter.apply(inner, args);
    }, delay);
  };
};