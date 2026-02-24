import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-12">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-secondary btn-sm"
      >
        &laquo; Previous
      </button>

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => handlePageClick(number)}
          className={`px-3 py-1 text-sm rounded-md border dark:border-dark-border ${
            currentPage === number
              ? 'bg-primary text-white font-bold border-primary'
              : 'bg-white text-slate-dark hover:bg-secondary dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-border'
          }`}
        >
          {number}
        </button>
      ))}

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary btn-sm"
      >
        Next &raquo;
      </button>
    </nav>
  );
};

export default Pagination;