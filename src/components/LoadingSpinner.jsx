const LoadingSpinner = () => {
  return (
    <div className=" h-[200px] w-[200px] m-auto">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <radialGradient
          id="a11"
          cx=".66"
          fx=".66"
          cy=".3125"
          fy=".3125"
          gradientTransform="scale(1.5)"
        >
          <stop offset="0" stop-color="#FF14EF"></stop>
          <stop offset=".3" stop-color="#FF14EF" stop-opacity=".9"></stop>
          <stop offset=".6" stop-color="#FF14EF" stop-opacity=".6"></stop>
          <stop offset=".8" stop-color="#FF14EF" stop-opacity=".3"></stop>
          <stop offset="1" stop-color="#FF14EF" stop-opacity="0"></stop>
        </radialGradient>
        <circle
          transform-origin="center"
          fill="none"
          stroke="url(#a11)"
          stroke-width="25"
          stroke-linecap="round"
          stroke-dasharray="200 1000"
          stroke-dashoffset="0"
          cx="100"
          cy="100"
          r="70"
        >
          <animateTransform
            type="rotate"
            attributeName="transform"
            calcMode="spline"
            dur="2"
            values="360;0"
            keyTimes="0;1"
            keySplines="0 0 1 1"
            repeatCount="indefinite"
          ></animateTransform>
        </circle>
        <circle
          transform-origin="center"
          fill="none"
          opacity=".2"
          stroke="#FF14EF"
          stroke-width="25"
          stroke-linecap="round"
          cx="100"
          cy="100"
          r="70"
        ></circle>
      </svg>
      <h1 className="m-auto"> Loading...</h1>
    </div>
  );
};

export default LoadingSpinner;
