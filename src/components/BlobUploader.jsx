import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './BlobUploader.css'

const BlobUploader = () => {
  const SUI_NETWORK = "testnet";
  const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

  const [publisherUrl, setPublisherUrl] = useState("https://publisher.walrus-testnet.walrus.space");
  const [aggregatorUrl, setAggregatorUrl] = useState("https://aggregator.walrus-testnet.walrus.space");
  const [file, setFile] = useState(null);
  const [epochs, setEpochs] = useState(1);
  const [uploadedBlobs, setUploadedBlobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`${publisherUrl}/v1/store?epochs=${epochs}`, {
        method: "PUT",
        body: file,
      });

      if (response.ok) {
        const info = await response.json();
        displayUpload(info, file.type);
      } else {
        throw new Error("Something went wrong when storing the blob!");
      }
    } catch (err) {
      setError("Error uploading file. Check the console for details.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUpload = (storageInfo, mediaType) => {
    let info;
    if (storageInfo.alreadyCertified) {
      info = {
        status: "Already certified",
        blobId: storageInfo.alreadyCertified.blobId,
        endEpoch: storageInfo.alreadyCertified.endEpoch,
        suiRefType: "Previous Sui Certified Event",
        suiRef: storageInfo.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
      };
    } else if (storageInfo.newlyCreated) {
      info = {
        status: "Newly created",
        blobId: storageInfo.newlyCreated.blobObject.blobId,
        endEpoch: storageInfo.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: "Associated Sui Object",
        suiRef: storageInfo.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
      };
    } else {
      throw new Error("Unhandled successful response!");
    }

    const blobUrl = `${aggregatorUrl}/v1/${info.blobId}`;
    const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;

    setUploadedBlobs((prev) => [
      {
        ...info,
        blobUrl,
        suiUrl,
        mediaType,
      },
      ...prev,
    ]);
  };

  return (
    <div className="container">
  <h1>Walrus Blob Upload</h1>
  <form onSubmit={handleUpload}>
    <div className="mb-3">
      <label className="form-label">Walrus Publisher URL</label>
      <input
        type="url"
        value={publisherUrl}
        onChange={(e) => setPublisherUrl(e.target.value)}
        className="form-control"
        required
      />
    </div>
    <div className="mb-3">
      <label className="form-label">Walrus Aggregator URL</label>
      <input
        type="url"
        value={aggregatorUrl}
        onChange={(e) => setAggregatorUrl(e.target.value)}
        className="form-control"
        required
      />
    </div>
    <div className="mb-3">
      <label className="form-label">Blob File</label>
      <input type="file" onChange={handleFileChange} className="form-control" required />
    </div>
    <div className="mb-3">
      <label className="form-label">Epochs</label>
      <input
        type="number"
        value={epochs}
        onChange={(e) => setEpochs(Number(e.target.value))}
        className="form-control"
        min="1"
        required
      />
    </div>
    <button type="submit" className="btn btn-primary" disabled={isUploading}>
      {isUploading ? "Uploading..." : "Upload"}
    </button>
  </form>

  {error && <div className="alert alert-danger mt-3">{error}</div>}

  <h2 className="mt-4">Uploaded Blobs</h2>
  <div>
    {uploadedBlobs.map((blob, index) => (
      <div key={index} className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">{blob.status}</h5>
          <p className="card-text">
            Blob ID: <a href={blob.blobUrl}>{blob.blobId}</a>
          </p>
          <p className="card-text">
            {blob.suiRefType}: <a href={blob.suiUrl}>{blob.suiRef}</a>
          </p>
          <p className="card-text">Stored Until Epoch: {blob.endEpoch}</p>
        </div>
      </div>
    ))}
  </div>
</div>
  );
};

export default BlobUploader;
