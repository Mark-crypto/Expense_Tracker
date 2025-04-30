import _ from "lodash";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/axiosInstance";

const BudgetSearchBar = () => {
  const [query, setQuery] = useState("");

  const fetchData = async ({ searchItem }) => {
    if (!searchItem) return [];
    const response = await axiosInstance.get(`/search2?q=${searchItem}`);
    return response.data.data;
  };
  const debouncedSearch = useCallback(
    _.debounce(({ searchItem, resolve }) => {
      fetchData(searchItem).then(resolve);
    }, 300),
    []
  );

  const queryFn = () => {
    new Promise((resolve) => debouncedSearch({ query, resolve }));
  };

  const { data: searchedItems, isLoading } = useQuery({
    queryKey: ["searchBudget", query],
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
export default BudgetSearchBar;
