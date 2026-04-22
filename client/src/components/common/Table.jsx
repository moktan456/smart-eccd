// SMART ECCD – Reusable Table Component
import LoadingSpinner from './LoadingSpinner';

const Table = ({ columns, data, loading, emptyMessage = 'No data found.' }) => {
  if (loading) return <div className="py-12"><LoadingSpinner className="h-8 w-8 mx-auto" /></div>;
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {data?.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">{emptyMessage}</td></tr>
          ) : (
            data?.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
