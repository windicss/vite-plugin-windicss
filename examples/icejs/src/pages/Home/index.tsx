const Home = () => {
  return (
    <div className="min-h-600px overflow-hidden text-center bg-white">
      <h2 className="text-40px text-center">Welcome to icejs!</h2>
      <p className="mt-40px">
        This is an awesome project powered by&nbsp;
        <a
          href="https://windicss.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          WindiCSS
        </a>
        , enjoy it!
      </p>
      <div className="mt-40px">
        <a
          href="https://ice.work/docs/guide/about"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginRight: 20,
          }}
        >
          使用文档
        </a>
        <a
          href="https://github.com/ice-lab/icejs"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
      <div className="mt-40px">
        <div
          className="btn"
          onClick={() => {
            location.href = 'https://ice.work/docs/guide/about';
          }}
        >
          Get Started with icejs
        </div>
        <div
          className="btn"
          onClick={() => {
            location.href = 'https://windicss.org';
          }}
        >
          Get Started with WindiCSS
        </div>
      </div>
    </div>
  );
};

export default Home;
