import { useParams } from "react-router-dom";

const SharedDocument = () => {
  const { token } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Shared Document</h1>
      <iframe
        src={`http://localhost:3001/api/shared-document/${token}`}
        width="100%"
        height="600px"
        title="Shared Document"
      ></iframe>
    </div>
  );
};

export default SharedDocument;