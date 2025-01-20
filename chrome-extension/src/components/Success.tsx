interface SuccessPageProps {
  valid: boolean;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ valid }) => {

  return (
    <div className="w-96 flex justify-center font-sans">
      <div className="text-center">
        <h1
          className={`text-2xl font-bold mb-2 ${valid ? "text-green-600" : "text-red-600"}`}
        >
          {valid ? "Success!" : "Failed!"}
        </h1>
        <p
          className={`text-gray-600 mb-4 ${valid ? "text-gray-600" : "text-red-600"}`}
        >
          {valid
            ? "Your key is successfully validated."
            : "Token verification process could not be completed. The key provided is invalid."}
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
