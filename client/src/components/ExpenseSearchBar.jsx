import _ from "lodash";
import { useState, useCallback } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const ExpenseSearchBar = () => {
  const [query, setQuery] = useState("");

  const fetchSearch = async (searchItem) => {
    if (!searchItem) return [];
    const res = await axios.get(
      `http://localhost:5000/api/search?q=${searchItem}`
    );
    return res.data.data;
  };

  const debouncedSearch = useCallback(
    _.debounce((searchItem, resolve) => {
      fetchSearch(searchItem).then(resolve);
    }, 300),
    []
  );

  const queryFn = () =>
    new Promise((resolve) => {
      debouncedSearch(query, resolve);
    });

  const { data: searchedItems, isLoading } = useQuery({
    queryKey: ["searchExpense", query],
    queryFn,
    enabled: !!query,
  });

  return (
    <>
      <div>
        <input
          type="text"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        <button type="button" onClick={fetchSearch}>
          {" "}
          Search
        </button>
        {isLoading && <p>Loading...</p>}
        {searchedItems?.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </>
  );
};
export default ExpenseSearchBar;
