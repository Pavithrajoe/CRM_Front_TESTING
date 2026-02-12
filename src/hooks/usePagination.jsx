import { useState, useMemo } from "react";

export default function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max( 1, Math.ceil(data.length / itemsPerPage) );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
  };
}