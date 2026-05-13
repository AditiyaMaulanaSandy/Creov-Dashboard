import { useState } from 'react';

export default function ReceiptItemVisual({ itemName, imageMap }) {
  const [isImageFailed, setIsImageFailed] = useState(false);
  const imageSrc = imageMap[itemName];

  if (!imageSrc || isImageFailed) {
    return (
      <div className="receipt-product-visual" aria-hidden="true">
        <div className="receipt-dessert-cup">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-product-visual">
      <img
        src={imageSrc}
        alt={itemName}
        className="receipt-product-image"
        loading="lazy"
        onError={() => setIsImageFailed(true)}
      />
    </div>
  );
}
