export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <span className="text-sm text-gray-600">Showing {start}-{end} of {total}</span>
      <div className="flex gap-1 flex-wrap">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 border rounded disabled:opacity-40">
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-2 py-1 border rounded ${p === page ? 'bg-blue-600 text-white' : ''}`}
          >
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 border rounded disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}
