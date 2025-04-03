import { Audio } from "react-loader-spinner";

const LoadingSpinner = () => {
  return (
    <Audio
      height="80"
      width="80"
      radius="9"
      color="green"
      ariaLabel="loading"
      wrapperStyle
      wrapperClass
    />
  );
};

export default LoadingSpinner;
