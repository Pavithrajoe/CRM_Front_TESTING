import React from "react";

function Pagination({ currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="flex justify-center gap-2 p-4">

      {/* Prev Button */}
      <button
        disabled={currentPage === 1}
        onClick={() => currentPage > 1 && setCurrentPage((previousPage) => previousPage - 1) }
        className={`px-3 py-1 border rounded disabled:opacity-50  ${ currentPage > 1
              ? "bg-blue-600 text-white border-blue-600"  : "bg-gray-200"
          }`}
      >
        Prev
      </button>

      {/* Page Info */}
      <span className="px-3 py-1 text-sm font-medium"> Page {currentPage} of {totalPages} </span>

      {/* Next Button */}
      <button disabled={currentPage === totalPages} onClick={() =>
          currentPage < totalPages &&
          setCurrentPage((previousPage) => previousPage + 1)
        }
        className={`px-3 py-1 border rounded disabled:opacity-50
          ${
            currentPage < totalPages
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-200"
          }`}
      >
        Next
      </button>

    </div>
  );
}

export default Pagination;
