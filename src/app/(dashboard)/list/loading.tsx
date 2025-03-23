const Loading = () => {
  return (
    <div className="p-8 animate-pulse bg-gray-900 min-h-screen flex justify-center items-center">
      <div className="rounded-lg overflow-hidden shadow-lg bg-gray-800 w-full max-w-4xl">
        <div className="p-8 bg-gray-700 flex space-x-4 rounded-t-lg">
          <div className="h-6 bg-gray-600 rounded w-1/6"></div>
          <div className="h-6 bg-gray-600 rounded w-2/6"></div>
          <div className="h-6 bg-gray-600 rounded w-1/6"></div>
          <div className="h-6 bg-gray-600 rounded w-1/6"></div>
        </div>
        <div className="p-6">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between mb-4 py-2 mt-4"
            >
              <div className="h-8 bg-gray-700 rounded w-1/6 mr-2"></div>
              <div className="h-8 bg-gray-700 rounded w-2/6 mr-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/6 mr-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
