import React from "react";

const SearchResultsList = ({ searchResults, handleSelectResult }) => {
  if (searchResults.length === 0) return null;

  const listings = searchResults?.filter((result) => !result.recipientName && !result?.title);
  const conversations = searchResults?.filter((result) => result.recipientName);
  const tasks = searchResults?.filter((result) => result?.title);

  return (
    <ul className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-white shadow-lg rounded-md overflow-hidden z-10">
      {listings.length > 0 && (
        <>
          <li className="px-4 py-2 bg-gray-200 font-bold text-gray-700">
            Listings
          </li>
          {listings?.map((result, index) => (
            <li
              key={`listing-${index}`}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelectResult(result)}
            >
              {result.name}
            </li>
          ))}
        </>
      )}

      {conversations?.length > 0 && (
        <>
          <li className="px-4 py-2 bg-gray-200 font-bold text-gray-700">
            Conversations
          </li>
          {conversations.map((result, index) => (
            <li
              key={`conversation-${index}`}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelectResult(result)}
            >
              {result.recipientName}
            </li>
          ))}
        </>
      )}

      {tasks.length > 0 && (
        <>
          <li className="px-4 py-2 bg-gray-200 font-bold text-gray-700">
            Tasks
          </li>
          {tasks.map((result, index) => (
            <li
              key={`task-${index}`}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelectResult(result)}
            >
              {result.title}
            </li>
          ))}
        </>
      )}
    </ul>
  );
};

export default SearchResultsList;
