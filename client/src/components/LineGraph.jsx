const LineGraph = ({ data }) => {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return (
    <>
      <div>
        {data.length > 0 ? (
          data.map((item, i) => {
            return (
              <div key={i}>
                <p>Month: {months[item.month - 1]}</p>
                <p>Active Users: {item.active_users}</p>
              </div>
            );
          })
        ) : (
          <p>No Data Found</p>
        )}
      </div>
    </>
  );
};
export default LineGraph;
